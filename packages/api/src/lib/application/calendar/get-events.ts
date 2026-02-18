/**
 * イベント取得ユースケース
 *
 * カレンダーイベントを取得するユースケースを提供します。
 * キャッシュ優先で、キャッシュが古い場合はプロバイダから再取得します。
 *
 * @module lib/application/calendar/get-events
 *
 * @example
 * ```typescript
 * import { getEventsForToday, getEventsForWeek, getEventsForRange } from '@/lib/application/calendar/get-events';
 * import { isOk } from '@/lib/domain/shared';
 *
 * // 今日のイベントを取得
 * const todayResult = await getEventsForToday(ctx);
 * if (isOk(todayResult)) {
 *   console.log(`今日のイベント: ${todayResult.value.length}件`);
 * }
 *
 * // 今週のイベントを取得
 * const weekResult = await getEventsForWeek(ctx);
 * if (isOk(weekResult)) {
 *   for (const event of weekResult.value) {
 *     console.log(`${event.title}: ${event.startTime}`);
 *   }
 * }
 * ```
 */

import type { CalendarConfig } from "@/lib/config";
import type { CalendarContext } from "@/lib/context/calendar-context";
import {
	type CalendarError,
	type CalendarEvent,
	type CalendarProvider,
	createTimeRange,
	getTodayRange,
	getWeekRange,
	sortEventsByStartTime,
	type TimeRange,
} from "@/lib/domain/calendar";
import type { EventRepository } from "@/lib/domain/calendar/repository";
import {
	err,
	isErr,
	isOk,
	isSome,
	type Option,
	ok,
	type Result,
} from "@/lib/domain/shared";
import type { DbError } from "@/lib/domain/shared/errors";
import type { CalendarId } from "@/lib/domain/shared/types";
import {
	GoogleCalendarProvider,
	ICalProvider,
	type OAuthTokens,
} from "@/lib/infrastructure/calendar";
import { createGoogleOAuthKey } from "@/lib/infrastructure/secret/types";

// ============================================================
// 定数
// ============================================================

/** キャッシュの有効期限（ミリ秒）: 1時間 */
const CACHE_TTL_MS = 60 * 60 * 1000;

// ============================================================
// エラー型
// ============================================================

/**
 * イベント取得エラーコード
 *
 * イベント取得時に発生しうるエラーの種別を表します。
 *
 * - DATABASE_ERROR: データベースアクセスエラー
 * - CONFIG_ERROR: 設定ファイル読み込みエラー
 * - PROVIDER_ERROR: カレンダープロバイダからの取得エラー
 */
export type GetEventsErrorCode =
	| "DATABASE_ERROR"
	| "CONFIG_ERROR"
	| "PROVIDER_ERROR";

/**
 * イベント取得エラー
 *
 * イベント取得時に発生するエラーを表現します。
 *
 * @property code - エラーコード
 * @property message - ユーザー向けエラーメッセージ
 * @property cause - エラーの原因（オプション）
 */
export interface GetEventsError {
	/** エラーコード */
	readonly code: GetEventsErrorCode;
	/** ユーザー向けエラーメッセージ */
	readonly message: string;
	/** エラーの原因（オプション） */
	readonly cause?: unknown;
}

// ============================================================
// エラーファクトリ
// ============================================================

/**
 * データベースエラーを生成
 */
function databaseError(cause: DbError): GetEventsError {
	return {
		code: "DATABASE_ERROR",
		message: `データベースエラー: ${cause.message}`,
		cause,
	};
}

/**
 * 設定エラーを生成
 */
function configError(message: string, cause?: unknown): GetEventsError {
	return {
		code: "CONFIG_ERROR",
		message: `設定エラー: ${message}`,
		cause,
	};
}

/**
 * プロバイダエラーを生成
 */
function providerError(cause: CalendarError): GetEventsError {
	return {
		code: "PROVIDER_ERROR",
		message: `カレンダー取得エラー: ${cause.message}`,
		cause,
	};
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * キャッシュが古いかどうかを判定
 *
 * @param lastSyncTime - 最終同期時刻
 * @returns キャッシュが古い（1時間以上経過）場合true
 */
function isCacheStale(lastSyncTime: Option<Date>): boolean {
	if (!isSome(lastSyncTime)) {
		return true;
	}

	const elapsed = Date.now() - lastSyncTime.value.getTime();
	return elapsed > CACHE_TTL_MS;
}

/**
 * カレンダー設定からプロバイダを作成
 *
 * @param ctx - カレンダーコンテキスト
 * @param config - カレンダー設定
 * @returns カレンダープロバイダ、またはnull（トークンが無い場合など）
 */
async function createProviderFromConfig(
	ctx: CalendarContext,
	config: CalendarConfig,
): Promise<CalendarProvider | null> {
	if (config.type === "google") {
		// Googleカレンダーの場合、トークンを取得
		if (!config.googleAccountEmail || !config.googleCalendarId) {
			return null;
		}

		const tokensJson = await ctx.secretRepository.getSecret(
			createGoogleOAuthKey(config.googleAccountEmail),
		);
		if (isErr(tokensJson)) {
			return null;
		}
		if (!tokensJson.value) {
			return null;
		}

		const stored = JSON.parse(tokensJson.value) as {
			accessToken: string;
			refreshToken: string;
			expiresAt: string;
		};
		const tokens: OAuthTokens = {
			...stored,
			expiresAt: new Date(stored.expiresAt),
		};

		return new GoogleCalendarProvider(config.googleAccountEmail, tokens);
	}

	if (config.type === "ical") {
		// iCalカレンダーの場合
		if (!config.icalUrl) {
			return null;
		}

		return new ICalProvider(config.icalUrl, config.name, config.id);
	}

	return null;
}

/**
 * プロバイダからイベントを取得し、キャッシュを更新
 *
 * @param provider - カレンダープロバイダ
 * @param providerCalendarId - プロバイダに渡すカレンダーID（Google APIのcalendarId等）
 * @param cacheCalendarId - DB保存用のカレンダーID（calendarsテーブルのFK）
 * @param calendarName - カレンダー名（イベントのsource情報に設定）
 * @param range - 取得する時間範囲
 * @param repository - イベントリポジトリ
 * @returns 取得したイベント、またはエラー
 */
async function fetchAndCacheEvents(
	provider: CalendarProvider,
	providerCalendarId: CalendarId,
	cacheCalendarId: CalendarId,
	calendarName: string,
	range: TimeRange,
	repository: EventRepository,
): Promise<Result<CalendarEvent[], GetEventsError>> {
	// プロバイダからイベントを取得
	const eventsResult = await provider.getEvents(providerCalendarId, range);
	if (isErr(eventsResult)) {
		return err(providerError(eventsResult.error));
	}

	// イベントのcalendarIdをキャッシュ用IDに変換
	const events = eventsResult.value.map((event) => ({
		...event,
		calendarId: cacheCalendarId,
		source: {
			...event.source,
			calendarName,
		},
	}));

	// キャッシュに保存
	const saveResult = await repository.saveMany(events);
	if (isErr(saveResult)) {
		// 保存に失敗してもイベントは返す（警告ログのみ）
		console.warn(
			`イベントのキャッシュ保存に失敗しました: ${saveResult.error.message}`,
		);
	}

	// 同期時刻を更新
	const syncTimeResult = await repository.updateLastSyncTime(
		cacheCalendarId,
		new Date(),
	);
	if (isErr(syncTimeResult)) {
		console.warn(
			`同期時刻の更新に失敗しました: ${syncTimeResult.error.message}`,
		);
	}

	return ok(events);
}

// ============================================================
// メインユースケース
// ============================================================

/**
 * 指定した時間範囲のイベントを取得
 *
 * キャッシュを優先し、キャッシュが古い場合（1時間以上経過）は
 * プロバイダから再取得します。
 *
 * @param ctx - カレンダーコンテキスト
 * @param range - 取得する時間範囲
 * @returns イベントの配列、またはエラー
 *
 * @example
 * ```typescript
 * const range = createTimeRange(new Date(), addDays(new Date(), 7));
 * const result = await getEventsForRange(ctx, range);
 *
 * if (isOk(result)) {
 *   console.log(`${result.value.length}件のイベントを取得`);
 * }
 * ```
 */
export async function getEventsForRange(
	ctx: CalendarContext,
	range: TimeRange,
): Promise<Result<CalendarEvent[], GetEventsError>> {
	const repository = ctx.eventRepository;

	// 設定を読み込み
	const calendarsJson = await ctx.configRepository.getSetting("calendars");
	if (isErr(calendarsJson)) {
		return err(
			configError("設定の読み込みに失敗しました", calendarsJson.error),
		);
	}

	const enabledCalendars: CalendarConfig[] = calendarsJson.value
		? (JSON.parse(calendarsJson.value) as CalendarConfig[]).filter(
				(cal) => cal.enabled,
			)
		: [];

	if (enabledCalendars.length === 0) {
		// 有効なカレンダーがない場合は空配列を返す
		return ok([]);
	}

	// 各カレンダーからイベントを取得
	const allEvents: CalendarEvent[] = [];
	const errors: GetEventsError[] = [];

	for (const calendarConfig of enabledCalendars) {
		// キャッシュの鮮度を確認
		const lastSyncResult = await repository.getLastSyncTime(calendarConfig.id);
		if (isErr(lastSyncResult)) {
			errors.push(databaseError(lastSyncResult.error));
			continue;
		}

		const lastSyncTime = lastSyncResult.value;

		if (isCacheStale(lastSyncTime)) {
			// キャッシュが古い場合はプロバイダから取得
			const provider = await createProviderFromConfig(ctx, calendarConfig);

			if (provider === null) {
				// プロバイダを作成できない場合はキャッシュから取得を試みる
				const cachedResult = await repository.findByRange(range);
				if (isOk(cachedResult)) {
					// このカレンダーのイベントのみをフィルタ
					const calendarEvents = cachedResult.value.filter(
						(event) => event.calendarId === calendarConfig.id,
					);
					allEvents.push(...calendarEvents);
				}
				continue;
			}

			// プロバイダからイベントを取得
			const providerCalendarId =
				calendarConfig.type === "google" && calendarConfig.googleCalendarId
					? (calendarConfig.googleCalendarId as CalendarId)
					: calendarConfig.id;

			// カレンダーレコードの存在を保証（FK制約対応）
			await repository.ensureCalendarRecord(
				calendarConfig.id,
				calendarConfig.name,
				calendarConfig.type,
				JSON.stringify(calendarConfig),
				calendarConfig.enabled,
			);

			const fetchResult = await fetchAndCacheEvents(
				provider,
				providerCalendarId,
				calendarConfig.id,
				calendarConfig.name,
				range,
				repository,
			);

			if (isOk(fetchResult)) {
				allEvents.push(...fetchResult.value);
			} else {
				// プロバイダからの取得に失敗した場合はキャッシュを使用
				errors.push(fetchResult.error);
				const cachedResult = await repository.findByRange(range);
				if (isOk(cachedResult)) {
					const calendarEvents = cachedResult.value.filter(
						(event) => event.calendarId === calendarConfig.id,
					);
					allEvents.push(...calendarEvents);
				}
			}
		} else {
			// キャッシュが新しい場合はキャッシュから取得
			const cachedResult = await repository.findByRange(range);
			if (isOk(cachedResult)) {
				const calendarEvents = cachedResult.value.filter(
					(event) => event.calendarId === calendarConfig.id,
				);
				allEvents.push(...calendarEvents);
			} else {
				errors.push(databaseError(cachedResult.error));
			}
		}
	}

	// エラーがあったがイベントも取得できた場合は警告のみ
	if (errors.length > 0 && allEvents.length === 0) {
		// すべて失敗した場合は最初のエラーを返す
		return err(errors[0]);
	}

	// イベントを開始時刻でソート
	const sortedEvents = sortEventsByStartTime(allEvents);

	return ok(sortedEvents);
}

/**
 * 今日のイベントを取得
 *
 * 今日の0時から23時59分59秒999ミリ秒までのイベントを取得します。
 *
 * @param ctx - カレンダーコンテキスト
 * @returns 今日のイベントの配列、またはエラー
 *
 * @example
 * ```typescript
 * const result = await getEventsForToday(ctx);
 *
 * if (isOk(result)) {
 *   console.log(`今日のイベント: ${result.value.length}件`);
 *   for (const event of result.value) {
 *     console.log(`- ${event.title}`);
 *   }
 * }
 * ```
 */
export async function getEventsForToday(
	ctx: CalendarContext,
): Promise<Result<CalendarEvent[], GetEventsError>> {
	const todayRange = getTodayRange();
	const range = createTimeRange(todayRange.startDate, todayRange.endDate);
	return getEventsForRange(ctx, range);
}

/**
 * 今週のイベントを取得
 *
 * 今週の月曜日から日曜日までのイベントを取得します。
 * 月曜日が週の始まりです。
 *
 * @param ctx - カレンダーコンテキスト
 * @returns 今週のイベントの配列、またはエラー
 *
 * @example
 * ```typescript
 * const result = await getEventsForWeek(ctx);
 *
 * if (isOk(result)) {
 *   console.log(`今週のイベント: ${result.value.length}件`);
 *
 *   // 日別にグループ化
 *   const byDay = groupByDay(result.value);
 * }
 * ```
 */
export async function getEventsForWeek(
	ctx: CalendarContext,
): Promise<Result<CalendarEvent[], GetEventsError>> {
	const weekRange = getWeekRange();
	const range = createTimeRange(weekRange.startDate, weekRange.endDate);
	return getEventsForRange(ctx, range);
}
