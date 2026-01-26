/**
 * カスタムフック バレルエクスポート
 *
 * カレンダー管理UIで使用するカスタムフックをまとめてエクスポートします。
 *
 * @module hooks
 *
 * @example
 * ```tsx
 * import {
 *   useCalendars,
 *   useAddGoogleCalendar,
 *   useAddICalCalendar,
 *   useDeleteCalendar,
 *   useSyncCalendars,
 * } from '@/hooks';
 * ```
 */

export type { UseAddGoogleCalendarResult } from "./useAddGoogleCalendar";
export { useAddGoogleCalendar } from "./useAddGoogleCalendar";
export type { UseAddICalCalendarResult } from "./useAddICalCalendar";
export { useAddICalCalendar } from "./useAddICalCalendar";
export type { UseCalendarsResult } from "./useCalendars";
export { useCalendars } from "./useCalendars";
export type { UseDeleteCalendarResult } from "./useDeleteCalendar";
export { useDeleteCalendar } from "./useDeleteCalendar";
export type { EventRange, UseEventsResult } from "./useEvents";
export { useEvents } from "./useEvents";
export type { SyncResult, UseSyncCalendarsResult } from "./useSyncCalendars";
export { useSyncCalendars } from "./useSyncCalendars";
