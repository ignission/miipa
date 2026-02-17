/**
 * 空き時間計算モジュール
 *
 * カレンダーイベントから営業時間内の空き時間を計算する純粋関数を提供します。
 *
 * @module lib/domain/calendar/free-slots
 */

import type { CalendarEvent } from "@/lib/domain/calendar/entities/event";
import { sortEventsByStartTime } from "@/lib/domain/calendar/entities/event";

// ============================================================
// 型定義
// ============================================================

/** 空き時間スロット */
export interface FreeSlot {
	readonly start: Date;
	readonly end: Date;
	readonly durationMinutes: number;
}

/** 空き時間計算オプション */
export interface FreeSlotsOptions {
	readonly date: Date;
	readonly workingHoursStart: number;
	readonly workingHoursEnd: number;
	readonly minDurationMinutes: number;
}

// ============================================================
// 定数
// ============================================================

/** JSTのオフセット（ミリ秒） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ============================================================
// メイン関数
// ============================================================

/**
 * 営業時間内の空き時間スロットを計算
 *
 * 終日イベントを除外し、営業時間と重なるイベントのみを考慮して
 * 空き時間を算出します。JST基準で計算されます。
 *
 * @param events - カレンダーイベントの配列
 * @param options - 計算オプション（dateは必須）
 * @returns 空き時間スロットの配列
 */
export function calculateFreeSlots(
	events: CalendarEvent[],
	options: Partial<FreeSlotsOptions> & { date: Date },
): FreeSlot[] {
	const workStart = options.workingHoursStart ?? 9;
	const workEnd = options.workingHoursEnd ?? 18;
	const minDuration = options.minDurationMinutes ?? 30;

	// JSTでの営業開始・終了時刻を計算
	const jstDate = new Date(options.date.getTime() + JST_OFFSET_MS);
	const year = jstDate.getUTCFullYear();
	const month = jstDate.getUTCMonth();
	const day = jstDate.getUTCDate();

	const dayStart = new Date(
		Date.UTC(year, month, day, workStart, 0, 0, 0) - JST_OFFSET_MS,
	);
	const dayEnd = new Date(
		Date.UTC(year, month, day, workEnd, 0, 0, 0) - JST_OFFSET_MS,
	);

	// 終日イベントを除外し、時間帯が重なるイベントのみフィルタ
	const timeEvents = sortEventsByStartTime(
		events.filter(
			(e) => !e.isAllDay && e.endTime > dayStart && e.startTime < dayEnd,
		),
	);

	const slots: FreeSlot[] = [];
	let current = dayStart;

	for (const event of timeEvents) {
		const eventStart = event.startTime < dayStart ? dayStart : event.startTime;
		const eventEnd = event.endTime > dayEnd ? dayEnd : event.endTime;

		if (current < eventStart) {
			const durationMinutes =
				(eventStart.getTime() - current.getTime()) / (1000 * 60);
			if (durationMinutes >= minDuration) {
				slots.push({
					start: new Date(current),
					end: new Date(eventStart),
					durationMinutes,
				});
			}
		}

		if (eventEnd > current) {
			current = eventEnd;
		}
	}

	// 最後のイベント後〜営業終了
	if (current < dayEnd) {
		const durationMinutes =
			(dayEnd.getTime() - current.getTime()) / (1000 * 60);
		if (durationMinutes >= minDuration) {
			slots.push({
				start: new Date(current),
				end: new Date(dayEnd),
				durationMinutes,
			});
		}
	}

	return slots;
}
