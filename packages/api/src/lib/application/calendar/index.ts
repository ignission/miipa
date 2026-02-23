/**
 * カレンダーアプリケーション層モジュール
 *
 * カレンダー機能に関するユースケースを提供します。
 * - イベント取得（今日・今週・月間）
 * - iCalカレンダーの追加
 * - Googleカレンダーの追加
 * - カレンダー同期
 *
 * @module lib/application/calendar
 *
 * @example
 * ```typescript
 * import {
 *   // イベント取得
 *   getEventsForToday,
 *   getEventsForWeek,
 *   getEventsForMonth,
 *
 *   // iCalカレンダー追加
 *   addICalCalendar,
 *
 *   // Googleカレンダー追加
 *   startGoogleAuth,
 *
 *   // カレンダー同期
 *   syncAllCalendars,
 * } from '@/lib/application/calendar';
 * import { isOk } from '@/lib/domain/shared';
 *
 * // 今日のイベントを取得
 * const result = await getEventsForToday(ctx);
 * if (isOk(result)) {
 *   console.log(`今日のイベント: ${result.value.length}件`);
 * }
 *
 * // iCalカレンダーを追加
 * const addResult = await addICalCalendar(
 *   ctx,
 *   'https://example.com/calendar.ics',
 *   '祝日カレンダー'
 * );
 *
 * // Google認証フローを開始
 * const authResult = startGoogleAuth();
 * if (isOk(authResult)) {
 *   const { url, codeVerifier, state } = authResult.value;
 *   // セッションにcodeVerifierとstateを保存してリダイレクト
 * }
 *
 * // 全カレンダーを同期
 * const syncResult = await syncAllCalendars(ctx);
 * if (isOk(syncResult)) {
 *   console.log(`${syncResult.value.successCount}件のカレンダーを同期しました`);
 * }
 * ```
 */

// ============================================================
// イベント取得ユースケース
// ============================================================

export {
	getEventsForMonth,
	getEventsForToday,
	getEventsForWeek,
} from "./get-events";

// ============================================================
// iCalカレンダー追加
// ============================================================

export { addICalCalendar } from "./add-ical-calendar";

// ============================================================
// Googleカレンダー追加
// ============================================================

// AuthUrlInfo はインフラ層から再エクスポート（startGoogleAuth の戻り値型として使用）
export { startGoogleAuth } from "./add-google-calendar";

// ============================================================
// カレンダー同期
// ============================================================

export { syncAllCalendars } from "./sync-calendars";
