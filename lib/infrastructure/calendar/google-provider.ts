/**
 * Google Calendar プロバイダ
 *
 * Google Calendar API との通信を担当するプロバイダ実装。
 * CalendarProvider インターフェースを実装し、カレンダー一覧取得と
 * イベント取得機能を提供します。
 *
 * ## 特徴
 *
 * - **calendar.readonly スコープのみ**: 読み取り専用アクセス
 * - **トークン自動リフレッシュ**: 期限切れ前に自動更新
 * - **Result型エラーハンドリング**: 型安全なエラー処理
 *
 * @module lib/infrastructure/calendar/google-provider
 *
 * @example
 * ```typescript
 * import { GoogleCalendarProvider } from '@/lib/infrastructure/calendar/google-provider';
 * import type { OAuthTokens } from '@/lib/infrastructure/calendar/token-store';
 *
 * // プロバイダを作成
 * const provider = new GoogleCalendarProvider('user@gmail.com', tokens, secretRepo);
 *
 * // カレンダー一覧を取得
 * const calendarsResult = await provider.getCalendars();
 * if (isOk(calendarsResult)) {
 *   for (const cal of calendarsResult.value) {
 *     console.log(cal.name);
 *   }
 * }
 *
 * // イベントを取得
 * const eventsResult = await provider.getEvents(
 *   createCalendarId('primary'),
 *   { startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
 * );
 * ```
 */

import {
	apiError,
	authExpired,
	type CalendarError,
	type CalendarEvent,
	type CalendarId,
	type CalendarProvider,
	createCalendarEvent,
	createEventId,
	networkError,
	type ProviderCalendar,
	type TimeRange,
} from "@/lib/domain/calendar";
import { err, ok, type Result } from "@/lib/domain/shared";
import type { D1SecretRepository } from "@/lib/infrastructure/secret/d1-secret-repository";
import { type OAuthTokens, refreshToken } from "./oauth-service";
import * as tokenStore from "./token-store";

// ============================================================
// Google Calendar API レスポンス型
// ============================================================

/** Google Calendar API のイベント型 */
interface GoogleCalendarEvent {
	id?: string;
	summary?: string;
	start?: { dateTime?: string; date?: string };
	end?: { dateTime?: string; date?: string };
	location?: string;
	description?: string;
}

/** Google Calendar API のカレンダーリストエントリ型 */
interface GoogleCalendarListEntry {
	id?: string;
	summary?: string;
	primary?: boolean;
	backgroundColor?: string;
}

/** Google Calendar API のリストレスポンス型 */
interface GoogleApiListResponse<T> {
	items?: T[];
}

// ============================================================
// Google Calendar プロバイダ
// ============================================================

/**
 * Google Calendar プロバイダ
 *
 * Google Calendar API を使用してカレンダーとイベントを取得します。
 * トークンの自動リフレッシュ機能を持ち、期限切れの場合は
 * 自動的に新しいトークンを取得します。
 */
export class GoogleCalendarProvider implements CalendarProvider {
	/** プロバイダの種類（CalendarProvider インターフェース） */
	readonly type = "google" as const;

	/**
	 * GoogleCalendarProvider を作成
	 *
	 * @param accountEmail - Google アカウントのメールアドレス
	 * @param tokens - OAuth トークン（アクセストークン、リフレッシュトークン、有効期限）
	 * @param secretRepo - D1SecretRepositoryインスタンス（トークンリフレッシュ時の保存用、省略可）
	 */
	constructor(
		private readonly accountEmail: string,
		private tokens: OAuthTokens,
		private readonly secretRepo?: D1SecretRepository,
	) {}

	/**
	 * カレンダー一覧を取得
	 *
	 * アカウントに紐づくすべてのカレンダーのリストを返します。
	 * 購読カレンダーも含まれます。
	 *
	 * @returns カレンダー情報の配列、またはエラー
	 *
	 * @example
	 * ```typescript
	 * const result = await provider.getCalendars();
	 * if (isOk(result)) {
	 *   const calendars = result.value;
	 *   const primaryCalendar = calendars.find(c => c.primary);
	 * }
	 * ```
	 */
	async getCalendars(): Promise<Result<ProviderCalendar[], CalendarError>> {
		// トークンの有効性を確認し、必要に応じてリフレッシュ
		const authResult = await this.ensureValidToken();
		if (authResult._tag === "Err") {
			return authResult;
		}

		try {
			const response = await fetch(
				"https://www.googleapis.com/calendar/v3/users/me/calendarList",
				{
					headers: { Authorization: `Bearer ${this.tokens.accessToken}` },
				},
			);

			if (!response.ok) {
				return await this.handleFetchError(response);
			}

			const data =
				(await response.json()) as GoogleApiListResponse<GoogleCalendarListEntry>;
			const calendars: ProviderCalendar[] = (data.items || []).map((item) => ({
				id: item.id || "",
				name: item.summary || "Unknown",
				primary: item.primary || false,
				color: item.backgroundColor ?? undefined,
			}));

			return ok(calendars);
		} catch (error) {
			return err(networkError("API呼び出しに失敗しました", error));
		}
	}

	/**
	 * 指定期間のイベントを取得
	 *
	 * 指定したカレンダーの指定期間内にあるイベントを返します。
	 * 繰り返しイベントは展開された状態で返されます（singleEvents=true）。
	 *
	 * @param calendarId - 取得対象のカレンダーID（'primary' または具体的なID）
	 * @param range - 取得期間（開始日時と終了日時）
	 * @returns イベントの配列、またはエラー
	 *
	 * @example
	 * ```typescript
	 * const todayRange = getTodayRange();
	 * const result = await provider.getEvents(
	 *   createCalendarId('primary'),
	 *   createTimeRange(todayRange.startDate, todayRange.endDate)
	 * );
	 * ```
	 */
	async getEvents(
		calendarId: CalendarId,
		range: TimeRange,
	): Promise<Result<CalendarEvent[], CalendarError>> {
		// トークンの有効性を確認し、必要に応じてリフレッシュ
		const authResult = await this.ensureValidToken();
		if (authResult._tag === "Err") {
			return authResult;
		}

		try {
			const params = new URLSearchParams({
				timeMin: range.start.toISOString(),
				timeMax: range.end.toISOString(),
				singleEvents: "true",
				orderBy: "startTime",
			});

			const response = await fetch(
				`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId as string)}/events?${params.toString()}`,
				{
					headers: { Authorization: `Bearer ${this.tokens.accessToken}` },
				},
			);

			if (!response.ok) {
				return await this.handleFetchError(response);
			}

			const data =
				(await response.json()) as GoogleApiListResponse<GoogleCalendarEvent>;
			const events = (data.items || []).map((item) =>
				this.convertToCalendarEvent(item, calendarId),
			);

			return ok(events);
		} catch (error) {
			return err(networkError("API呼び出しに失敗しました", error));
		}
	}

	// ============================================================
	// 内部メソッド
	// ============================================================

	/**
	 * トークンが有効かどうかを確認し、必要に応じてリフレッシュ
	 *
	 * トークンの有効期限が近い場合（5分以内）は自動的にリフレッシュを行い、
	 * 新しいトークンを Keychain に保存します。
	 *
	 * @returns 成功時は Ok(void)、失敗時は Err(CalendarError)
	 */
	private async ensureValidToken(): Promise<Result<void, CalendarError>> {
		// トークンが有効ならそのまま返す
		if (!tokenStore.isTokenExpired(this.tokens)) {
			return ok(undefined);
		}

		// トークンをリフレッシュ
		const refreshResult = await refreshToken(this.tokens.refreshToken);
		if (refreshResult._tag === "Err") {
			return err(
				authExpired(this.accountEmail, "トークンの更新に失敗しました"),
			);
		}

		// 新しいトークンを保存
		this.tokens = refreshResult.value;
		if (this.secretRepo) {
			const saveResult = await tokenStore.saveTokens(
				this.secretRepo,
				this.accountEmail,
				this.tokens,
			);

			// 保存に失敗してもAPI呼び出しは可能なので、ここではエラーを無視
			// ただしログ出力などの対応は検討の余地あり
			if (saveResult._tag === "Err") {
				console.warn(
					`トークンの保存に失敗しました: ${this.accountEmail}`,
					saveResult.error,
				);
			}
		}

		return ok(undefined);
	}

	/**
	 * Google Calendar API のイベントを CalendarEvent エンティティに変換
	 *
	 * 終日イベントと時刻指定イベントの両方に対応しています。
	 *
	 * @param item - Google Calendar API から取得したイベントデータ
	 * @param calendarId - イベントが所属するカレンダーのID
	 * @returns CalendarEvent エンティティ
	 */
	private convertToCalendarEvent(
		item: GoogleCalendarEvent,
		calendarId: CalendarId,
	): CalendarEvent {
		// 終日イベントかどうかを判定
		// 終日イベントの場合は dateTime ではなく date が設定される
		const isAllDay = !item.start?.dateTime;

		// 開始・終了時刻を取得
		const startTime = isAllDay
			? new Date(item.start?.date || "")
			: new Date(item.start?.dateTime || "");
		const endTime = isAllDay
			? new Date(item.end?.date || "")
			: new Date(item.end?.dateTime || "");

		return createCalendarEvent({
			id: createEventId(item.id || ""),
			calendarId,
			title: item.summary || "(タイトルなし)",
			startTime,
			endTime,
			isAllDay,
			location: item.location ?? undefined,
			description: item.description ?? undefined,
			source: {
				type: "google",
				calendarName: "", // カレンダー名は別途設定が必要
				accountEmail: this.accountEmail,
			},
		});
	}

	/**
	 * fetch レスポンスエラーをハンドリング
	 *
	 * HTTP ステータスコードに応じて適切な CalendarError を生成します。
	 *
	 * @param response - fetch のレスポンス
	 * @returns Err(CalendarError)
	 */
	private async handleFetchError(
		response: Response,
	): Promise<Result<never, CalendarError>> {
		const status = response.status;

		// 認証エラー（401: Unauthorized, 403: Forbidden）
		if (status === 401 || status === 403) {
			return err(authExpired(this.accountEmail, "認証が必要です"));
		}

		const body = await response.text().catch(() => "");
		return err(apiError(body || response.statusText, status));
	}
}
