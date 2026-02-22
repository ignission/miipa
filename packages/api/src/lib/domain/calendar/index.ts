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
	CalendarId,
	TimeRange,
} from "./types";

export {
	createCalendarId,
	createEventId,
	createTimeRange,
	getMonthRange,
	getTodayRange,
	getWeekRange,
} from "./types";

// ============================================================
// entities/event.ts - イベントエンティティ
// ============================================================

export type { CalendarEvent } from "./entities/event";

export {
	createCalendarEvent,
	sortEventsByStartTime,
} from "./entities/event";

// ============================================================
// provider.ts - プロバイダインターフェースとエラー
// ============================================================

export type {
	CalendarError,
	CalendarProvider,
	ProviderCalendar,
} from "./provider";

export {
	apiError,
	authExpired,
	authRequired,
	invalidUrl,
	networkError,
	parseError,
} from "./provider";
