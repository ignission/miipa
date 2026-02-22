/**
 * iCal プロバイダ
 *
 * iCal URLからカレンダーイベントを取得するプロバイダ実装。
 * RFC 5545 (iCalendar) 形式のデータを解析し、統一されたCalendarEvent型に変換します。
 *
 * @module lib/infrastructure/calendar/ical-provider
 */

import ICAL from "ical.js";
import {
	type CalendarError,
	type CalendarEvent,
	type CalendarId,
	type CalendarProvider,
	createCalendarEvent,
	createEventId,
	invalidUrl,
	networkError,
	type ProviderCalendar,
	parseError,
	type TimeRange,
} from "@/lib/domain/calendar";
import { err, ok, type Result } from "@/lib/domain/shared";
import {
	isInternalHost,
	readResponseWithSizeLimit,
} from "@/lib/infrastructure/network";

/** フェッチタイムアウト（ミリ秒） */
const FETCH_TIMEOUT = 10000;

/** iCalイベント数の上限 */
const MAX_ICAL_EVENT_COUNT = 10000;

// ============================================================
// 型定義
// ============================================================

/**
 * iCal URL 検証結果
 *
 * validateICalUrl関数が返すメタデータ。
 * カレンダー名とイベント数を含みます。
 */
export interface ICalMeta {
	/** カレンダーの表示名 */
	readonly name: string;
	/** カレンダーに含まれるイベント数 */
	readonly eventCount: number;
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * リダイレクトレスポンスを検出してエラーを返す
 *
 * SSRF対策として、リダイレクト先が内部ネットワークに向かうことを防止します。
 *
 * @param response - fetchレスポンス
 * @returns リダイレクト検出時はCalendarError、それ以外はnull
 */
function checkRedirectResponse(response: Response): CalendarError | null {
	if (response.status >= 300 && response.status < 400) {
		return networkError(
			"リダイレクトが検出されました。直接アクセス可能なURLを指定してください",
		);
	}
	return null;
}

/**
 * iCal URL を検証
 *
 * 指定されたURLが有効なiCalフィードかどうかを検証します。
 * SSRF対策として内部ネットワークのURLを拒否し、
 * 実際にURLにアクセスしてiCalデータをパースし、メタ情報を返します。
 *
 * @param url - 検証対象のiCal URL
 * @returns 成功時はICalMeta、失敗時はCalendarError
 *
 * @example
 * ```typescript
 * const result = await validateICalUrl('https://example.com/calendar.ics');
 * if (isOk(result)) {
 *   console.log(`カレンダー名: ${result.value.name}`);
 *   console.log(`イベント数: ${result.value.eventCount}`);
 * }
 * ```
 */
export async function validateICalUrl(
	url: string,
): Promise<Result<ICalMeta, CalendarError>> {
	// URLの形式チェック
	let parsed: URL;
	try {
		parsed = new URL(url);
		if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
			return err(
				invalidUrl("URLはhttp://またはhttps://で始まる必要があります"),
			);
		}
	} catch {
		return err(invalidUrl("無効なURL形式です"));
	}

	// SSRF対策: 内部ネットワークのURLを拒否（CWE-918）
	if (isInternalHost(parsed.hostname)) {
		return err(invalidUrl("内部ネットワークのURLは指定できません"));
	}

	// 実際にフェッチして検証
	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

		const response = await fetch(url, {
			signal: controller.signal,
			redirect: "manual",
		});
		clearTimeout(timeout);

		// リダイレクト検出
		const redirectError = checkRedirectResponse(response);
		if (redirectError) {
			return err(redirectError);
		}

		if (!response.ok) {
			return err(networkError(`URL取得に失敗しました: ${response.status}`));
		}

		// サイズ制限付き読み込み
		const text = await readResponseWithSizeLimit(response);
		if (text === null) {
			return err(
				networkError("レスポンスサイズが上限（5MB）を超えています"),
			);
		}

		const jcal = ICAL.parse(text);
		const comp = new ICAL.Component(jcal);

		const name =
			(comp.getFirstPropertyValue("x-wr-calname") as string) ||
			"iCal カレンダー";
		const events = comp.getAllSubcomponents("vevent");

		// イベント数制限
		if (events.length > MAX_ICAL_EVENT_COUNT) {
			return err(
				parseError(
					`イベント数が上限（${MAX_ICAL_EVENT_COUNT}件）を超えています`,
				),
			);
		}

		return ok({ name, eventCount: events.length });
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return err(networkError("タイムアウトしました"));
		}
		return err(parseError("iCalのパースに失敗しました", error));
	}
}

// ============================================================
// ICalProvider クラス
// ============================================================

/**
 * iCal プロバイダ
 *
 * iCal URL からイベントを取得するCalendarProviderの実装。
 * Google Calendar以外のiCal形式をサポートするカレンダーサービスに対応します。
 *
 * @example
 * ```typescript
 * const provider = new ICalProvider(
 *   'https://example.com/calendar.ics',
 *   '祝日カレンダー',
 *   createCalendarId('ical-holidays')
 * );
 *
 * const result = await provider.getEvents(
 *   createCalendarId('ical-holidays'),
 *   getTodayRange()
 * );
 * ```
 */
export class ICalProvider implements CalendarProvider {
	/** プロバイダの種類 */
	readonly type = "ical" as const;

	/**
	 * ICalProviderを作成
	 *
	 * @param url - iCal URL
	 * @param name - カレンダーの表示名
	 * @param calendarId - カレンダーID
	 */
	constructor(
		private readonly url: string,
		private readonly name: string,
		private readonly calendarId: CalendarId,
	) {}

	/**
	 * カレンダー一覧を取得
	 *
	 * iCalプロバイダは単一のカレンダーを表すため、
	 * コンストラクタで指定された情報を含む配列を返します。
	 *
	 * @returns カレンダー情報の配列（常に1要素）
	 */
	async getCalendars(): Promise<Result<ProviderCalendar[], CalendarError>> {
		return ok([
			{
				id: this.calendarId as string,
				name: this.name,
				primary: false,
			},
		]);
	}

	/**
	 * 指定期間のイベントを取得
	 *
	 * iCal URLからデータを取得し、指定された期間内のイベントを返します。
	 * 期間外のイベントはフィルタリングされます。
	 *
	 * @param _calendarId - カレンダーID（iCalでは使用しない）
	 * @param range - 取得期間
	 * @returns イベントの配列、またはエラー
	 */
	async getEvents(
		_calendarId: CalendarId,
		range: TimeRange,
	): Promise<Result<CalendarEvent[], CalendarError>> {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

			const response = await fetch(this.url, {
				signal: controller.signal,
				redirect: "manual",
			});
			clearTimeout(timeout);

			// リダイレクト検出
			const redirectError = checkRedirectResponse(response);
			if (redirectError) {
				return err(redirectError);
			}

			if (!response.ok) {
				return err(networkError(`iCal取得に失敗しました: ${response.status}`));
			}

			// サイズ制限付き読み込み
			const text = await readResponseWithSizeLimit(response);
			if (text === null) {
				return err(
					networkError("レスポンスサイズが上限（5MB）を超えています"),
				);
			}

			const events = this.parseEvents(text, this.calendarId, range);

			return ok(events);
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				return err(networkError("タイムアウトしました"));
			}
			return err(networkError("iCal取得に失敗しました", error));
		}
	}

	/**
	 * iCalテキストをパースしてイベントを抽出
	 *
	 * @param icalText - iCalフォーマットのテキスト
	 * @param calendarId - カレンダーID
	 * @param range - フィルタリング用の時間範囲
	 * @returns パースされたイベントの配列
	 * @private
	 */
	private parseEvents(
		icalText: string,
		calendarId: CalendarId,
		range: TimeRange,
	): CalendarEvent[] {
		const jcal = ICAL.parse(icalText);
		const comp = new ICAL.Component(jcal);
		const vevents = comp.getAllSubcomponents("vevent");

		const events: CalendarEvent[] = [];

		for (const vevent of vevents) {
			// イベント数制限
			if (events.length >= MAX_ICAL_EVENT_COUNT) {
				break;
			}

			const event = new ICAL.Event(vevent);
			const startTime = event.startDate.toJSDate();
			const endTime = event.endDate.toJSDate();

			// 範囲外のイベントはスキップ
			if (endTime < range.start || startTime > range.end) {
				continue;
			}

			events.push(
				createCalendarEvent({
					id: createEventId(event.uid),
					calendarId,
					title: event.summary || "(タイトルなし)",
					startTime,
					endTime,
					isAllDay: event.startDate.isDate,
					location: event.location || undefined,
					description: event.description || undefined,
					source: {
						type: "ical",
						calendarName: this.name,
					},
				}),
			);
		}

		return events;
	}
}
