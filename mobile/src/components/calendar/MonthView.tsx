import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import {
	type CalendarDay,
	formatDateKey,
	generateCalendarGrid,
	groupEventsByDate,
} from "../../lib/calendar-utils";
import { CalendarGrid } from "./CalendarGrid";
import { DayEventList } from "./DayEventList";
import { MonthHeader } from "./MonthHeader";
import { WeekdayHeader } from "./WeekdayHeader";

interface MonthViewProps {
	year: number;
	month: number;
	events: UICalendarEvent[];
	onPrevMonth: () => void;
	onNextMonth: () => void;
}

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

	const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

	const eventDateKeys = useMemo(() => {
		return new Set(eventsByDate.keys());
	}, [eventsByDate]);

	const selectedEvents = useMemo(() => {
		return eventsByDate.get(selectedDateKey) ?? [];
	}, [eventsByDate, selectedDateKey]);

	const selectedDateLabel = useMemo(() => {
		const parts = selectedDateKey.split("-");
		const date = new Date(
			Number(parts[0]),
			Number(parts[1]) - 1,
			Number(parts[2]),
		);
		const weekday = date.toLocaleDateString("ja-JP", { weekday: "short" });
		const m = date.getMonth() + 1;
		const d = date.getDate();
		const isToday = selectedDateKey === todayKey;
		return isToday
			? `今日 ${m}/${d}（${weekday}）`
			: `${m}/${d}（${weekday}）`;
	}, [selectedDateKey, todayKey]);

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
			<DayEventList events={selectedEvents} dateLabel={selectedDateLabel} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
