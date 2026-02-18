/**
 * カレンダー同期ユースケース
 *
 * 複数のカレンダーソースからイベントを取得し、
 * ローカルキャッシュに保存する同期処理を提供します。
 *
 * ## 機能
 *
 * - **syncAllCalendars**: 全有効カレンダーの並列同期
 * - **syncCalendar**: 単一カレンダーの同期
 *
 * ## 特徴
 *
 * - Result型による型安全なエラーハンドリング
 * - 並列処理による効率的な同期
 * - 部分的な失敗の追跡（一部カレンダーが失敗しても他は継続）
 * - CalendarContextによるマルチテナント対応
 *
 * @module lib/application/calendar/sync-calendars
 *
 * @example
 * ```typescript
 * import { syncAllCalendars, syncCalendar } from '@/lib/application/calendar/sync-calendars';
 * import { isOk } from '@/lib/domain/shared';
 *
 * // 全カレンダーを同期
 * const result = await syncAllCalendars(ctx);
 * if (isOk(result)) {
 *   console.log(`同期完了: ${result.value.successCount}件成功`);
 *   if (result.value.errorCalendars.length > 0) {
 *     console.warn('失敗したカレンダー:', result.value.errorCalendars);
 *   }
 * }
 *
 * // 単一カレンダーを同期
 * const singleResult = await syncCalendar(ctx, createCalendarId('google-work'));
 * ```
 */

import type { CalendarConfig } from "@/lib/config";
import type { CalendarContext } from "@/lib/context/calendar-context";
import type {
	CalendarError,
	CalendarEvent,
	CalendarId,
	TimeRange,
} from "@/lib/domain/calendar";
import { createCalendarId, createTimeRange } from "@/lib/domain/calendar";
import type { EventRepository } from "@/lib/domain/calendar/repository";
import {
	type ConfigError,
	err,
	isErr,
	ok,
	type Result,
} from "@/lib/domain/shared";
import type { DbError } from "@/lib/domain/shared/errors";
import {
	GoogleCalendarProvider,
	ICalProvider,
	type OAuthTokens,
} from "@/lib/infrastructure/calendar";
import {
	createGoogleOAuthKey,
	type SecretError,
} from "@/lib/infrastructure/secret/types";

// ============================================================
// 型定義
// ============================================================

/**
 * 同期エラーコード
 */
export type SyncErrorCode =
	| "SYNC_CONFIG_ERROR"
	| "SYNC_DB_ERROR"
	| "SYNC_PROVIDER_ERROR"
	| "SYNC_CALENDAR_NOT_FOUND"
	| "SYNC_TOKEN_NOT_FOUND";

/**
 * 同期エラー
 *
 * カレンダー同期処理で発生するエラーを表現します。
 */
export interface SyncError {
	/** エラーコード */
	readonly code: SyncErrorCode;
	/** エラーメッセージ */
	readonly message: string;
	/** カレンダーID（特定のカレンダーでエラーが発生した場合） */
	readonly calendarId?: CalendarId;
	/** 元のエラー（デバッグ用） */
	readonly cause?: CalendarError | ConfigError | DbError | SecretError;
}

/**
 * 同期失敗したカレンダーの情報
 */
export interface ErrorCalendarInfo {
	/** カレンダーID */
	readonly calendarId: CalendarId;
	/** カレンダー名 */
	readonly name: string;
	/** エラー情報 */
	readonly error: SyncError;
}

/**
 * 全カレンダー同期の結果
 */
export interface SyncAllResult {
	/** 同期成功したカレンダー数 */
	readonly successCount: number;
	/** 同期失敗したカレンダー情報 */
	readonly errorCalendars: readonly ErrorCalendarInfo[];
	/** 全カレンダー数 */
	readonly totalCount: number;
	/** 同期時刻 */
	readonly syncedAt: Date;
}

/**
 * 単一カレンダー同期の結果
 */
export interface SyncResult {
	/** カレンダーID */
	readonly calendarId: CalendarId;
	/** 同期されたイベント数 */
	readonly eventCount: number;
	/** 同期時刻 */
	readonly syncedAt: Date;
}

// ============================================================
// エラーファクトリ
// ============================================================

/**
 * 設定エラーを生成
 */
function syncConfigError(message: string, cause?: ConfigError): SyncError {
	return { code: "SYNC_CONFIG_ERROR", message, cause };
}

/**
 * データベースエラーを生成
 */
function syncDbError(
	message: string,
	calendarId?: CalendarId,
	cause?: DbError,
): SyncError {
	return { code: "SYNC_DB_ERROR", message, calendarId, cause };
}

/**
 * プロバイダエラーを生成
 */
function syncProviderError(
	message: string,
	calendarId: CalendarId,
	cause?: CalendarError,
): SyncError {
	return { code: "SYNC_PROVIDER_ERROR", message, calendarId, cause };
}

/**
 * カレンダー未検出エラーを生成
 */
function syncCalendarNotFound(calendarId: CalendarId): SyncError {
	return {
		code: "SYNC_CALENDAR_NOT_FOUND",
		message: `カレンダーが見つかりません: ${calendarId}`,
		calendarId,
	};
}

/**
 * トークン未検出エラーを生成
 */
function syncTokenNotFound(
	calendarId: CalendarId,
	accountEmail: string,
): SyncError {
	return {
		code: "SYNC_TOKEN_NOT_FOUND",
		message: `認証情報が見つかりません: ${accountEmail}`,
		calendarId,
	};
}

// ============================================================
// 同期期間設定
// ============================================================

/**
 * 同期対象期間を取得
 *
 * 現在時刻から前後30日間を同期対象とします。
 *
 * @returns TimeRange
 */
function getSyncTimeRange(): TimeRange {
	const now = new Date();

	// 30日前の0時0分0秒
	const start = new Date(now);
	start.setDate(start.getDate() - 30);
	start.setHours(0, 0, 0, 0);

	// 30日後の23時59分59秒
	const end = new Date(now);
	end.setDate(end.getDate() + 30);
	end.setHours(23, 59, 59, 999);

	return createTimeRange(start, end);
}

// ============================================================
// 単一カレンダー同期
// ============================================================

/**
 * 単一カレンダーを同期
 *
 * 指定されたカレンダーからイベントを取得し、ローカルキャッシュに保存します。
 * カレンダーの種類（Google/iCal）に応じて適切なプロバイダを使用します。
 *
 * @param ctx - カレンダーコンテキスト（マルチテナント対応）
 * @param calendarId - 同期するカレンダーのID
 * @returns 成功時はOk<SyncResult>、失敗時はErr<SyncError>
 *
 * @example
 * ```typescript
 * const result = await syncCalendar(ctx, createCalendarId('google-work'));
 *
 * if (isOk(result)) {
 *   console.log(`${result.value.eventCount}件のイベントを同期しました`);
 * } else {
 *   console.error(`同期失敗: ${result.error.message}`);
 * }
 * ```
 */
export async function syncCalendar(
	ctx: CalendarContext,
	calendarId: CalendarId,
): Promise<Result<SyncResult, SyncError>> {
	// 設定からカレンダー一覧を取得
	const calendarsResult = await ctx.configRepository.getSetting("calendars");
	if (isErr(calendarsResult)) {
		return err(syncConfigError("設定の読み込みに失敗しました"));
	}

	const calendars: CalendarConfig[] = calendarsResult.value
		? (JSON.parse(calendarsResult.value) as CalendarConfig[])
		: [];

	// カレンダー設定を検索
	const calendarConfig = calendars.find((c) => c.id === calendarId);
	if (!calendarConfig) {
		return err(syncCalendarNotFound(calendarId));
	}

	const repository = ctx.eventRepository;
	const timeRange = getSyncTimeRange();

	// プロバイダからイベントを取得
	const eventsResult = await fetchEventsFromProvider(
		ctx,
		calendarConfig,
		timeRange,
	);
	if (isErr(eventsResult)) {
		return eventsResult;
	}

	const events = eventsResult.value;

	// イベントをキャッシュに保存
	const saveResult = await repository.saveMany(events);
	if (isErr(saveResult)) {
		return err(
			syncDbError("イベントの保存に失敗しました", calendarId, saveResult.error),
		);
	}

	// 同期時刻を更新
	const syncTime = new Date();
	const updateTimeResult = await repository.updateLastSyncTime(
		calendarId,
		syncTime,
	);
	if (isErr(updateTimeResult)) {
		// 時刻更新の失敗は警告のみ（同期自体は成功）
		console.warn(
			`同期時刻の更新に失敗しました: ${calendarId}`,
			updateTimeResult.error,
		);
	}

	return ok({
		calendarId,
		eventCount: events.length,
		syncedAt: syncTime,
	});
}

// ============================================================
// 全カレンダー同期
// ============================================================

/**
 * 全有効カレンダーを同期
 *
 * 設定に登録されている全ての有効なカレンダーを並列で同期します。
 * 一部のカレンダーで失敗しても、他のカレンダーの同期は継続されます。
 *
 * @param ctx - カレンダーコンテキスト（マルチテナント対応）
 * @returns 成功時はOk<SyncAllResult>、設定読み込み失敗時はErr<SyncError>
 *
 * @example
 * ```typescript
 * const result = await syncAllCalendars(ctx);
 *
 * if (isOk(result)) {
 *   const { successCount, errorCalendars, totalCount } = result.value;
 *   console.log(`同期完了: ${successCount}/${totalCount}件成功`);
 *
 *   if (errorCalendars.length > 0) {
 *     console.warn('失敗したカレンダー:');
 *     for (const { name, error } of errorCalendars) {
 *       console.warn(`  - ${name}: ${error.message}`);
 *     }
 *   }
 * }
 * ```
 */
export async function syncAllCalendars(
	ctx: CalendarContext,
): Promise<Result<SyncAllResult, SyncError>> {
	// 設定からカレンダー一覧を取得
	const calendarsResult = await ctx.configRepository.getSetting("calendars");
	if (isErr(calendarsResult)) {
		return err(syncConfigError("設定の読み込みに失敗しました"));
	}

	const calendars: CalendarConfig[] = calendarsResult.value
		? (JSON.parse(calendarsResult.value) as CalendarConfig[])
		: [];

	// 有効なカレンダーのみ抽出
	const enabledCalendars = calendars.filter((c) => c.enabled);

	if (enabledCalendars.length === 0) {
		return ok({
			successCount: 0,
			errorCalendars: [],
			totalCount: 0,
			syncedAt: new Date(),
		});
	}

	const repository = ctx.eventRepository;
	const timeRange = getSyncTimeRange();
	const syncTime = new Date();

	// 全カレンダーを並列で同期
	const syncResults = await Promise.all(
		enabledCalendars.map((calendarConfig) =>
			syncSingleCalendar(ctx, calendarConfig, repository, timeRange, syncTime),
		),
	);

	// 結果を集計
	const successCount = syncResults.filter((r) => r.success).length;
	const errorCalendars: ErrorCalendarInfo[] = syncResults
		.filter((r) => !r.success && r.error)
		.map((r) => ({
			calendarId: r.calendarId,
			name: r.name,
			error: r.error as SyncError,
		}));

	return ok({
		successCount,
		errorCalendars,
		totalCount: enabledCalendars.length,
		syncedAt: syncTime,
	});
}

// ============================================================
// 内部ヘルパー関数
// ============================================================

/**
 * 単一カレンダー同期の内部結果型
 */
interface InternalSyncResult {
	readonly calendarId: CalendarId;
	readonly name: string;
	readonly success: boolean;
	readonly eventCount?: number;
	readonly error?: SyncError;
}

/**
 * 単一カレンダーを同期（内部用）
 *
 * syncAllCalendarsから呼び出される内部関数。
 * 例外をスローせず、成功/失敗をInternalSyncResultで返します。
 *
 * @param ctx - カレンダーコンテキスト
 * @param calendarConfig - カレンダー設定
 * @param repository - イベントリポジトリ
 * @param timeRange - 同期対象期間
 * @param syncTime - 同期時刻
 * @returns InternalSyncResult
 */
async function syncSingleCalendar(
	ctx: CalendarContext,
	calendarConfig: CalendarConfig,
	repository: EventRepository,
	timeRange: TimeRange,
	syncTime: Date,
): Promise<InternalSyncResult> {
	const calendarId = calendarConfig.id;
	const name = calendarConfig.name;

	// プロバイダからイベントを取得
	const eventsResult = await fetchEventsFromProvider(
		ctx,
		calendarConfig,
		timeRange,
	);
	if (isErr(eventsResult)) {
		console.error(
			`[sync] カレンダー同期失敗: ${calendarId}`,
			JSON.stringify(eventsResult.error),
		);
		return {
			calendarId,
			name,
			success: false,
			error: eventsResult.error,
		};
	}

	const events = eventsResult.value;

	// カレンダーレコードの存在を保証（FK制約対応）
	const ensureResult = await repository.ensureCalendarRecord(
		calendarConfig.id,
		calendarConfig.name,
		calendarConfig.type,
		JSON.stringify(calendarConfig),
		calendarConfig.enabled,
	);
	if (isErr(ensureResult)) {
		console.warn(
			`[sync] カレンダーレコード作成失敗: ${calendarId}`,
			ensureResult.error,
		);
	}

	// イベントをキャッシュに保存
	const saveResult = await repository.saveMany(events);
	if (isErr(saveResult)) {
		console.error(
			`[sync] イベント保存失敗: ${calendarId}`,
			JSON.stringify(saveResult.error),
		);
		return {
			calendarId,
			name,
			success: false,
			error: syncDbError(
				"イベントの保存に失敗しました",
				calendarId,
				saveResult.error,
			),
		};
	}

	// 同期時刻を更新
	const updateTimeResult = await repository.updateLastSyncTime(
		calendarId,
		syncTime,
	);
	if (isErr(updateTimeResult)) {
		// 時刻更新の失敗は警告のみ
		console.warn(
			`同期時刻の更新に失敗しました: ${calendarId}`,
			updateTimeResult.error,
		);
	}

	return {
		calendarId,
		name,
		success: true,
		eventCount: events.length,
	};
}

/**
 * プロバイダからイベントを取得
 *
 * カレンダーの種類に応じて適切なプロバイダを使用してイベントを取得します。
 *
 * @param ctx - カレンダーコンテキスト
 * @param calendarConfig - カレンダー設定
 * @param timeRange - 取得期間
 * @returns イベントの配列、またはエラー
 */
async function fetchEventsFromProvider(
	ctx: CalendarContext,
	calendarConfig: CalendarConfig,
	timeRange: TimeRange,
): Promise<Result<CalendarEvent[], SyncError>> {
	const calendarId = calendarConfig.id;

	if (calendarConfig.type === "google") {
		return fetchGoogleCalendarEvents(ctx, calendarConfig, timeRange);
	}

	if (calendarConfig.type === "ical") {
		return fetchICalEvents(calendarConfig, timeRange);
	}

	// 未サポートのカレンダータイプ
	return err({
		code: "SYNC_PROVIDER_ERROR",
		message: `未サポートのカレンダータイプ: ${calendarConfig.type}`,
		calendarId,
	});
}

/**
 * Google Calendarからイベントを取得
 *
 * @param ctx - カレンダーコンテキスト（トークン取得に使用）
 * @param calendarConfig - カレンダー設定
 * @param timeRange - 取得期間
 * @returns イベントの配列、またはエラー
 */
async function fetchGoogleCalendarEvents(
	ctx: CalendarContext,
	calendarConfig: CalendarConfig,
	timeRange: TimeRange,
): Promise<Result<CalendarEvent[], SyncError>> {
	const calendarId = calendarConfig.id;
	const accountEmail = calendarConfig.googleAccountEmail;
	const googleCalendarId = calendarConfig.googleCalendarId;

	if (!accountEmail || !googleCalendarId) {
		return err(
			syncProviderError("Googleカレンダーの設定が不完全です", calendarId),
		);
	}

	// シークレットリポジトリからトークンを取得
	const tokensJson = await ctx.secretRepository.getSecret(
		createGoogleOAuthKey(accountEmail),
	);
	if (isErr(tokensJson)) {
		return err({
			code: "SYNC_TOKEN_NOT_FOUND",
			message: `認証情報の取得に失敗しました: ${accountEmail}`,
			calendarId,
			cause: tokensJson.error,
		});
	}

	if (!tokensJson.value) {
		return err(syncTokenNotFound(calendarId, accountEmail));
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

	// プロバイダを作成してイベントを取得
	const provider = new GoogleCalendarProvider(accountEmail, tokens);
	const eventsResult = await provider.getEvents(
		createCalendarId(googleCalendarId),
		timeRange,
	);

	if (isErr(eventsResult)) {
		return err(
			syncProviderError(
				`Googleカレンダーからのイベント取得に失敗しました: ${eventsResult.error.message}`,
				calendarId,
				eventsResult.error,
			),
		);
	}

	// イベントにカレンダーIDを設定
	const events = eventsResult.value.map((event) => ({
		...event,
		calendarId,
		source: {
			...event.source,
			calendarName: calendarConfig.name,
		},
	}));

	return ok(events);
}

/**
 * iCalからイベントを取得
 */
async function fetchICalEvents(
	calendarConfig: CalendarConfig,
	timeRange: TimeRange,
): Promise<Result<CalendarEvent[], SyncError>> {
	const calendarId = calendarConfig.id;
	const icalUrl = calendarConfig.icalUrl;

	if (!icalUrl) {
		return err(syncProviderError("iCal URLが設定されていません", calendarId));
	}

	// プロバイダを作成してイベントを取得
	const provider = new ICalProvider(icalUrl, calendarConfig.name, calendarId);
	const eventsResult = await provider.getEvents(calendarId, timeRange);

	if (isErr(eventsResult)) {
		return err(
			syncProviderError(
				`iCalからのイベント取得に失敗しました: ${eventsResult.error.message}`,
				calendarId,
				eventsResult.error,
			),
		);
	}

	return ok(eventsResult.value);
}
