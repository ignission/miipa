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

/** JSTオフセット（ミリ秒）: UTC+9 */
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 1日のミリ秒 */
export const DAY_MS = 24 * 60 * 60 * 1000;

/** 曜日フォーマッタ（モジュールスコープでキャッシュしレンダー毎の再生成を防止） */
const weekdayFormatter = new Intl.DateTimeFormat("ja-JP", {
	weekday: "short",
	timeZone: "UTC",
});

/** 日付ヘッダーのフォーマット（JST基準、「今日 2/23（月）」or「2/23（月）」） */
export function formatSectionHeader(date: Date, isToday: boolean): string {
	const jst = new Date(date.getTime() + JST_OFFSET_MS);
	const weekday = weekdayFormatter.format(jst);
	const month = jst.getUTCMonth() + 1;
	const day = jst.getUTCDate();
	return isToday
		? `今日 ${month}/${day}（${weekday}）`
		: `${month}/${day}（${weekday}）`;
}

/** 日付キーを生成（YYYY-MM-DD、JST基準） */
export function formatDateKey(date: Date): string {
	const jst = new Date(date.getTime() + JST_OFFSET_MS);
	const y = jst.getUTCFullYear();
	const m = (jst.getUTCMonth() + 1).toString().padStart(2, "0");
	const d = jst.getUTCDate().toString().padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/** カレンダーグリッド（6行x7列 = 42セル）を生成（月曜始まり） */
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

/** イベントを日付キーでグルーピング */
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
