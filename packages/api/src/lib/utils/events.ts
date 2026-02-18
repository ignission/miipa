/**
 * イベントユーティリティ関数
 *
 * カレンダーイベントの操作に関するユーティリティ関数を提供します。
 * - groupEventsByDate: イベントを日付ごとにグループ化
 *
 * @module lib/utils/events
 */

import type { CalendarEvent } from "@/lib/domain/calendar/entities/event";
import { sortEventsByStartTime } from "@/lib/domain/calendar/entities/event";

/**
 * JSTタイムゾーンのオフセット（ミリ秒）
 *
 * UTC+9 = 9 * 60 * 60 * 1000
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * DateをJSTの "YYYY-MM-DD" 形式の文字列に変換
 *
 * @param date - 変換対象のDate
 * @returns JSTベースの "YYYY-MM-DD" 形式の文字列
 *
 * @example
 * ```typescript
 * // UTC 2026-01-25T15:00:00.000Z -> JST 2026-01-26T00:00:00
 * formatDateKey(new Date("2026-01-25T15:00:00.000Z")); // "2026-01-26"
 * ```
 */
function formatDateKey(date: Date): string {
	// UTCにJSTオフセットを足してJST相当の時刻を得る
	const jstTime = new Date(date.getTime() + JST_OFFSET_MS);
	const year = jstTime.getUTCFullYear();
	const month = String(jstTime.getUTCMonth() + 1).padStart(2, "0");
	const day = String(jstTime.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * イベントを日付ごとにグループ化
 *
 * イベントの開始時刻を基準に、JSTベースで日付ごとにグループ化します。
 * 日付キーは "YYYY-MM-DD" 形式で、日付順にソートされています。
 * 各日付内のイベントは開始時刻順にソートされています。
 *
 * @param events - グループ化するイベントの配列
 * @returns 日付キーをキーとし、イベント配列を値とするオブジェクト
 *
 * @example
 * ```typescript
 * const events = [event1, event2, event3];
 * const grouped = groupEventsByDate(events);
 * // {
 * //   "2026-01-26": [event1, event2],
 * //   "2026-01-27": [event3]
 * // }
 *
 * // 日付順にアクセス
 * Object.keys(grouped).forEach(dateKey => {
 *   console.log(`${dateKey}の予定:`, grouped[dateKey]);
 * });
 * ```
 */
export function groupEventsByDate(
	events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
	// 空配列の場合は早期リターン
	if (events.length === 0) {
		return {};
	}

	// イベントをまず開始時刻でソート
	const sortedEvents = sortEventsByStartTime(events);

	// 日付ごとにグループ化
	const grouped: Record<string, CalendarEvent[]> = {};

	for (const event of sortedEvents) {
		const dateKey = formatDateKey(event.startTime);

		if (!grouped[dateKey]) {
			grouped[dateKey] = [];
		}

		grouped[dateKey].push(event);
	}

	// 日付キーをソートして新しいオブジェクトを構築
	const sortedKeys = Object.keys(grouped).sort();
	const sortedGrouped: Record<string, CalendarEvent[]> = {};

	for (const key of sortedKeys) {
		sortedGrouped[key] = grouped[key];
	}

	return sortedGrouped;
}
