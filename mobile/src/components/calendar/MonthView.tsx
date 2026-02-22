import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import {
	type CalendarDay,
	formatDateKey,
	generateCalendarGrid,
	groupEventsByDate,
} from "../../lib/calendar-utils";
import { CalendarGrid } from "./CalendarGrid";
import { DayGroup } from "./DayGroup";
import { MonthHeader } from "./MonthHeader";
import { WeekdayHeader } from "./WeekdayHeader";

/** 月表示コンポーネントのProps */
interface MonthViewProps {
	/** 年 */
	year: number;
	/** 月（1〜12） */
	month: number;
	/** 表示するイベントの配列 */
	events: UICalendarEvent[];
	/** 前月へ移動するコールバック */
	onPrevMonth: () => void;
	/** 次月へ移動するコールバック */
	onNextMonth: () => void;
}

/** 月カレンダービュー（グリッド + 選択日のイベントリスト） */
export function MonthView({
	year,
	month,
	events,
	onPrevMonth,
	onNextMonth,
}: MonthViewProps) {
	const todayKey = formatDateKey(new Date());
	const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

	const grid = useMemo(() => generateCalendarGrid(year, month), [year, month]);

	useEffect(() => {
		const today = new Date();
		const currentMonthMatch =
			today.getFullYear() === year && today.getMonth() + 1 === month;
		if (currentMonthMatch) {
			setSelectedDateKey(formatDateKey(today));
		} else {
			setSelectedDateKey(formatDateKey(new Date(year, month - 1, 1)));
		}
	}, [year, month]);

	const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

	const eventDateKeys = useMemo(() => {
		return new Set(eventsByDate.keys());
	}, [eventsByDate]);

	const selectedEvents = useMemo(() => {
		return eventsByDate.get(selectedDateKey) ?? [];
	}, [eventsByDate, selectedDateKey]);

	const selectedDate = useMemo(() => {
		const parts = selectedDateKey.split("-");
		return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
	}, [selectedDateKey]);

	const isSelectedDateToday = selectedDateKey === todayKey;

	const handleDayPress = useCallback((day: CalendarDay) => {
		setSelectedDateKey(day.dateKey);
	}, []);

	return (
		<View style={styles.container}>
			<MonthHeader
				year={year}
				month={month}
				onPrevMonth={onPrevMonth}
				onNextMonth={onNextMonth}
			/>
			<WeekdayHeader />
			<CalendarGrid
				grid={grid}
				selectedDateKey={selectedDateKey}
				eventDateKeys={eventDateKeys}
				onDayPress={handleDayPress}
			/>
			<DayGroup
				date={selectedDate}
				events={selectedEvents}
				isToday={isSelectedDateToday}
				variant="monthDetail"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
