import type { UICalendarEvent } from "../hooks/useEvents";

/** カレンダーグリッドの1セルのデータ */
export interface CalendarDay {
	/** 日付 */
	date: Date;
	/** 日（1-31） */
	day: number;
	/** 表示対象月かどうか */
	isCurrentMonth: boolean;
	/** 今日かどうか */
	isToday: boolean;
	/** 日付キー（YYYY-MM-DD） */
	dateKey: string;
}

/**
 * 日付キーを生成（YYYY-MM-DD）
 */
export function formatDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = (date.getMonth() + 1).toString().padStart(2, "0");
	const d = date.getDate().toString().padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/**
 * カレンダーグリッド（6行×7列 = 42セル）を生成
 *
 * 月曜始まりで前月末・次月初の日付も含みます。
 *
 * @param year - 年
 * @param month - 月（1〜12）
 * @returns 42個のCalendarDay配列
 */
export function generateCalendarGrid(
	year: number,
	month: number,
): CalendarDay[] {
	const today = new Date();
	const todayKey = formatDateKey(today);

	// 月の1日目
	const firstDay = new Date(year, month - 1, 1);
	// 月曜始まりの曜日インデックス（月=0, 火=1, ..., 日=6）
	const startWeekday = (firstDay.getDay() + 6) % 7;

	// グリッド開始日（前月の日を含む）
	const gridStart = new Date(firstDay);
	gridStart.setDate(gridStart.getDate() - startWeekday);

	const grid: CalendarDay[] = [];

	for (let i = 0; i < 42; i++) {
		const date = new Date(gridStart);
		date.setDate(gridStart.getDate() + i);

		const dateKey = formatDateKey(date);

		grid.push({
			date,
			day: date.getDate(),
			isCurrentMonth: date.getMonth() === month - 1,
			isToday: dateKey === todayKey,
			dateKey,
		});
	}

	return grid;
}

/**
 * イベントを日付キーでグルーピング
 *
 * @param events - イベント配列
 * @returns 日付キー → イベント配列のMap
 */
export function groupEventsByDate(
	events: UICalendarEvent[],
): Map<string, UICalendarEvent[]> {
	const grouped = new Map<string, UICalendarEvent[]>();

	for (const event of events) {
		const key = formatDateKey(event.startTime);
		const list = grouped.get(key) ?? [];
		list.push(event);
		grouped.set(key, list);
	}

	return grouped;
}
