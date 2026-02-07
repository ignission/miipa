/**
 * カレンダードメイン型定義
 *
 * このモジュールはカレンダードメイン固有の値オブジェクトと型を提供します。
 * - CalendarSource: カレンダーソース情報
 * - CalendarType: カレンダーの種類
 * - CalendarConfig: カレンダー設定
 * - 時間範囲ユーティリティ関数
 *
 * @module lib/domain/calendar/types
 */

import {
	type Brand,
	type CalendarId,
	createCalendarId,
	createEventId,
	createTimeRange,
	type EventId,
	isValidCalendarId,
	isValidEventId,
	isValidTimeRange,
	type TimeRange,
} from "@/lib/domain/shared/types";

// 共通型を再エクスポート（カレンダードメインで使用する型）
export type { Brand, CalendarId, EventId, TimeRange };
export {
	createCalendarId,
	createEventId,
	createTimeRange,
	isValidCalendarId,
	isValidEventId,
	isValidTimeRange,
};

// ============================================================
// カレンダーソース
// ============================================================

/**
 * カレンダーの種類
 *
 * サポートされるカレンダープロバイダの識別子です。
 *
 * - 'google': Google Calendar
 * - 'ical': iCal形式のURL（CalDAV、その他のカレンダーサービス）
 *
 * @example
 * ```typescript
 * const type: CalendarType = 'google';
 * ```
 */
export type CalendarType = "google" | "ical";

/**
 * CalendarTypeの有効な値一覧
 *
 * ランタイムでの検証に使用します。
 */
export const CALENDAR_TYPES: readonly CalendarType[] = [
	"google",
	"ical",
] as const;

/**
 * 値が有効なCalendarTypeかどうかを判定します
 *
 * @param value - 検証対象の値
 * @returns 有効なCalendarTypeの場合true
 *
 * @example
 * ```typescript
 * if (isValidCalendarType(userInput)) {
 *   // userInput は CalendarType 型として扱える
 * }
 * ```
 */
export function isValidCalendarType(value: unknown): value is CalendarType {
	return (
		typeof value === "string" && CALENDAR_TYPES.includes(value as CalendarType)
	);
}

/**
 * カレンダーソース情報
 *
 * カレンダーの種類と名前、オプションでアカウント情報を保持します。
 * イミュータブルな設計で、すべてのプロパティはreadonlyです。
 *
 * @property type - カレンダーの種類（google | ical）
 * @property calendarName - カレンダーの表示名
 * @property accountEmail - Googleカレンダーの場合のアカウントメール（任意）
 *
 * @example
 * ```typescript
 * const googleSource: CalendarSource = {
 *   type: 'google',
 *   calendarName: '仕事用カレンダー',
 *   accountEmail: 'user@example.com'
 * };
 *
 * const icalSource: CalendarSource = {
 *   type: 'ical',
 *   calendarName: '祝日カレンダー'
 * };
 * ```
 */
export interface CalendarSource {
	/** カレンダーの種類 */
	readonly type: CalendarType;
	/** カレンダーの表示名 */
	readonly calendarName: string;
	/** Googleカレンダーの場合のアカウントメール */
	readonly accountEmail?: string;
}

/**
 * CalendarSourceを作成します
 *
 * @param params - CalendarSourceのパラメータ
 * @returns 不変のCalendarSourceオブジェクト
 *
 * @example
 * ```typescript
 * const source = createCalendarSource({
 *   type: 'google',
 *   calendarName: '仕事用',
 *   accountEmail: 'work@example.com'
 * });
 * ```
 */
export function createCalendarSource(params: CalendarSource): CalendarSource {
	return Object.freeze({ ...params });
}

// ============================================================
// 時間範囲ユーティリティ
// ============================================================

/**
 * 日付範囲の戻り値型
 *
 * getTodayRange、getWeekRangeで使用する日付範囲を表します。
 */
export interface DateRangeResult {
	readonly startDate: Date;
	readonly endDate: Date;
}

/**
 * JSTのオフセット（ミリ秒）
 *
 * UTC+9時間 = 9 * 60 * 60 * 1000 = 32400000ms
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 今日の時間範囲を取得します（JST基準）
 *
 * JST（日本標準時 UTC+9）での今日の0時0分0秒から23時59分59秒999ミリ秒までの範囲をUTC時刻で返します。
 * Cloudflare Workers上でもJST基準で正確に動作します。
 *
 * @returns 今日の開始から終了までのDateRangeResult（UTC時刻）
 *
 * @example
 * ```typescript
 * const todayRange = getTodayRange();
 * // JST 2026-02-07の場合:
 * // { startDate: 2026-02-06T15:00:00.000Z (JST 2026-02-07T00:00:00),
 * //   endDate: 2026-02-07T14:59:59.999Z (JST 2026-02-07T23:59:59.999) }
 * ```
 */
export function getTodayRange(): DateRangeResult {
	const now = new Date();
	// JSTの現在日付を計算
	const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
	const year = jstNow.getUTCFullYear();
	const month = jstNow.getUTCMonth();
	const date = jstNow.getUTCDate();

	// JSTの0時0分0秒をUTCに変換
	const startDate = new Date(
		Date.UTC(year, month, date, 0, 0, 0, 0) - JST_OFFSET_MS,
	);
	// JSTの23時59分59秒999msをUTCに変換
	const endDate = new Date(
		Date.UTC(year, month, date, 23, 59, 59, 999) - JST_OFFSET_MS,
	);

	return Object.freeze({ startDate, endDate });
}

/**
 * 今日から7日間の時間範囲を取得します（JST基準）
 *
 * JST（日本標準時 UTC+9）での今日の0時0分0秒から7日後の23時59分59秒999ミリ秒までの範囲をUTC時刻で返します。
 * 従来の「今週の月曜〜日曜」から変更し、土曜日でも来週月曜のイベントが表示されるようになります。
 * Cloudflare Workers上でもJST基準で正確に動作します。
 *
 * @returns 今日から7日間のDateRangeResult（UTC時刻）
 *
 * @example
 * ```typescript
 * const weekRange = getWeekRange();
 * // JST 2026-02-07（金曜）に実行した場合:
 * // { startDate: 2026-02-06T15:00:00.000Z (JST 2026-02-07T00:00:00),
 * //   endDate: 2026-02-13T14:59:59.999Z (JST 2026-02-14T23:59:59.999) }
 * ```
 */
export function getWeekRange(): DateRangeResult {
	const now = new Date();
	// JSTの現在日付を計算
	const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
	const year = jstNow.getUTCFullYear();
	const month = jstNow.getUTCMonth();
	const date = jstNow.getUTCDate();

	// JSTの今日の0時0分0秒をUTCに変換
	const startDate = new Date(
		Date.UTC(year, month, date, 0, 0, 0, 0) - JST_OFFSET_MS,
	);
	// JSTの7日後の23時59分59秒999msをUTCに変換
	const endDate = new Date(
		Date.UTC(year, month, date + 7, 23, 59, 59, 999) - JST_OFFSET_MS,
	);

	return Object.freeze({ startDate, endDate });
}

// ============================================================
// カレンダー設定
// ============================================================

/**
 * カレンダー設定
 *
 * カレンダーの識別情報、種類、表示設定、プロバイダ固有の設定を保持します。
 * イミュータブルな設計で、すべてのプロパティはreadonlyです。
 *
 * @property id - カレンダーを一意に識別するID
 * @property type - カレンダーの種類（google | ical）
 * @property name - カレンダーの表示名
 * @property enabled - カレンダーが有効かどうか
 * @property color - カレンダーの表示色（任意）
 * @property googleAccountEmail - Googleアカウントのメールアドレス（Google固有）
 * @property googleCalendarId - GoogleカレンダーのID（Google固有）
 * @property icalUrl - iCalのURL（iCal固有）
 *
 * @example
 * ```typescript
 * // Googleカレンダー設定
 * const googleConfig: CalendarConfig = {
 *   id: createCalendarId('google-work'),
 *   type: 'google',
 *   name: '仕事用カレンダー',
 *   enabled: true,
 *   color: '#4285F4',
 *   googleAccountEmail: 'user@example.com',
 *   googleCalendarId: 'primary'
 * };
 *
 * // iCalカレンダー設定
 * const icalConfig: CalendarConfig = {
 *   id: createCalendarId('ical-holidays'),
 *   type: 'ical',
 *   name: '日本の祝日',
 *   enabled: true,
 *   color: '#EA4335',
 *   icalUrl: 'https://example.com/holidays.ics'
 * };
 * ```
 */
export interface CalendarConfig {
	/** カレンダーを一意に識別するID */
	readonly id: CalendarId;
	/** カレンダーの種類 */
	readonly type: CalendarType;
	/** カレンダーの表示名 */
	readonly name: string;
	/** カレンダーが有効かどうか */
	readonly enabled: boolean;
	/** カレンダーの表示色（CSS色文字列） */
	readonly color?: string;

	// Google固有の設定
	/** Googleアカウントのメールアドレス */
	readonly googleAccountEmail?: string;
	/** GoogleカレンダーのID（'primary'または具体的なカレンダーID） */
	readonly googleCalendarId?: string;

	// iCal固有の設定
	/** iCalのURL */
	readonly icalUrl?: string;
}

/**
 * CalendarConfigのパラメータ型
 *
 * CalendarConfigを作成する際のパラメータです。
 * idは省略可能で、省略時は自動生成されます。
 */
export type CalendarConfigParams = Omit<CalendarConfig, "id"> & {
	readonly id?: CalendarId;
};

/**
 * CalendarConfigを作成します
 *
 * @param params - CalendarConfigのパラメータ
 * @returns 不変のCalendarConfigオブジェクト
 *
 * @example
 * ```typescript
 * const config = createCalendarConfig({
 *   type: 'google',
 *   name: '仕事用',
 *   enabled: true,
 *   googleAccountEmail: 'user@example.com',
 *   googleCalendarId: 'primary'
 * });
 * ```
 */
export function createCalendarConfig(
	params: CalendarConfigParams,
): CalendarConfig {
	const id = params.id ?? createCalendarId(crypto.randomUUID());
	return Object.freeze({ ...params, id });
}

/**
 * CalendarConfigが有効かどうかを検証します
 *
 * 検証条件:
 * - nameが空でない
 * - typeが有効なCalendarType
 * - Googleタイプの場合、googleAccountEmailとgoogleCalendarIdが必須
 * - iCalタイプの場合、icalUrlが必須
 *
 * @param config - 検証対象のCalendarConfig
 * @returns 有効な場合true
 *
 * @example
 * ```typescript
 * if (isValidCalendarConfig(config)) {
 *   // configは有効な設定
 * }
 * ```
 */
export function isValidCalendarConfig(config: CalendarConfig): boolean {
	if (!config.name || config.name.trim().length === 0) {
		return false;
	}

	if (!isValidCalendarType(config.type)) {
		return false;
	}

	if (config.type === "google") {
		return !!(config.googleAccountEmail && config.googleCalendarId);
	}

	if (config.type === "ical") {
		return !!config.icalUrl;
	}

	return false;
}
