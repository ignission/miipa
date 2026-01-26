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
 * 今日の時間範囲を取得します
 *
 * 今日の0時0分0秒から23時59分59秒999ミリ秒までの範囲を返します。
 *
 * @returns 今日の開始から終了までのDateRangeResult
 *
 * @example
 * ```typescript
 * const todayRange = getTodayRange();
 * // { startDate: 2026-01-26T00:00:00.000, endDate: 2026-01-26T23:59:59.999 }
 * ```
 */
export function getTodayRange(): DateRangeResult {
	const now = new Date();
	const startDate = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		0,
		0,
		0,
		0,
	);
	const endDate = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		23,
		59,
		59,
		999,
	);
	return Object.freeze({ startDate, endDate });
}

/**
 * 今週の時間範囲を取得します（月曜始まり）
 *
 * 今週の月曜日0時0分0秒から日曜日23時59分59秒999ミリ秒までの範囲を返します。
 * 日本のビジネス慣習に合わせて月曜日を週の始まりとしています。
 *
 * @returns 今週の月曜から日曜までのDateRangeResult
 *
 * @example
 * ```typescript
 * const weekRange = getWeekRange();
 * // 2026-01-26（日曜）に実行した場合:
 * // { startDate: 2026-01-20T00:00:00.000, endDate: 2026-01-26T23:59:59.999 }
 * ```
 */
export function getWeekRange(): DateRangeResult {
	const now = new Date();
	const dayOfWeek = now.getDay();
	// 日曜=0なので調整（月曜を週の始まりに）
	const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

	const monday = new Date(now);
	monday.setDate(now.getDate() + diff);
	monday.setHours(0, 0, 0, 0);

	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	sunday.setHours(23, 59, 59, 999);

	return Object.freeze({ startDate: monday, endDate: sunday });
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
