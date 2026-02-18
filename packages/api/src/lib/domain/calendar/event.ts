/**
 * カレンダーイベントエンティティ - バレルエクスポート
 *
 * entities/event.ts の公開APIを再エクスポートします。
 * 後方互換性のため、./event からのインポートをサポートします。
 *
 * @module lib/domain/calendar/event
 */

export type {
	CalendarEvent,
	CalendarSource,
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
