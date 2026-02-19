import { StyleSheet, View } from "react-native";
import type { CalendarDay } from "../../lib/calendar-utils";
import { DayCell } from "./DayCell";

interface CalendarGridProps {
	grid: CalendarDay[];
	selectedDateKey: string;
	eventDateKeys: Set<string>;
	onDayPress: (day: CalendarDay) => void;
}

export function CalendarGrid({
	grid,
	selectedDateKey,
	eventDateKeys,
	onDayPress,
}: CalendarGridProps) {
	return (
		<View style={styles.grid}>
			{grid.map((day) => (
				<DayCell
					key={day.dateKey}
					day={day}
					isSelected={day.dateKey === selectedDateKey}
					hasEvents={eventDateKeys.has(day.dateKey)}
					onPress={onDayPress}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
});
