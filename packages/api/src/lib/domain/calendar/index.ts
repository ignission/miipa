/**
 * カレンダードメインモジュール
 *
 * カレンダードメイン層の公開APIを提供します。
 * - 型定義と値オブジェクト
 * - イベントエンティティとファクトリ関数
 * - リポジトリインターフェース
 * - プロバイダインターフェースとエラー型
 *
 * @module lib/domain/calendar
 *
 * @example
 * ```typescript
 * import {
 *   type CalendarEvent,
 *   type CalendarProvider,
 *   createCalendarEvent,
 *   getTodayRange,
 * } from '@/lib/domain/calendar';
 * ```
 */

// ============================================================
// types.ts - 型定義と値オブジェクト
// ============================================================

export type {
	Brand,
	CalendarConfig,
	CalendarConfigParams,
	CalendarId,
	CalendarSource,
	CalendarType,
	DateRangeResult,
	EventId,
	TimeRange,
} from "./types";

export {
	CALENDAR_TYPES,
	createCalendarConfig,
	createCalendarId,
	createCalendarSource,
	createEventId,
	createTimeRange,
	getTodayRange,
	getWeekRange,
	isValidCalendarConfig,
	isValidCalendarId,
	isValidCalendarType,
	isValidEventId,
	isValidTimeRange,
} from "./types";

// ============================================================
// entities/event.ts - イベントエンティティ
// ============================================================

export type {
	CalendarEvent,
	CalendarSource as EventCalendarSource,
	CreateCalendarEventParams,
} from "./entities/event";

export {
	createCalendarEvent,
	getEventDuration,
	getEventDurationInMinutes,
	isAllDayEvent,
	isEventOnDate,
	sortEventsByStartTime,
} from "./entities/event";

// ============================================================
// repository.ts - リポジトリインターフェース
// ============================================================

export type { CalendarRepository, EventRepository } from "./repository";

// ============================================================
// provider.ts - プロバイダインターフェースとエラー
// ============================================================

export type {
	CalendarError,
	CalendarErrorCode,
	CalendarProvider,
	ProviderCalendar,
} from "./provider";

export {
	apiError,
	authExpired,
	authRequired,
	invalidUrl,
	networkError,
	notFound,
	parseError,
} from "./provider";
