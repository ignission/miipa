import { memo } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import type { CalendarDay } from "../../lib/calendar-utils";

const CELL_SIZE = Math.floor(Dimensions.get("window").width / 7);

interface DayCellProps {
	day: CalendarDay;
	isSelected: boolean;
	hasEvents: boolean;
	onPress: (day: CalendarDay) => void;
}

export const DayCell = memo(function DayCell({
	day,
	isSelected,
	hasEvents,
	onPress,
}: DayCellProps) {
	return (
		<Pressable
			style={styles.cell}
			onPress={() => onPress(day)}
			accessibilityRole="button"
			accessibilityLabel={`${day.date.getMonth() + 1}月${day.day}日`}
		>
			<View
				style={[
					styles.dayCircle,
					day.isToday && styles.todayCircle,
					isSelected && !day.isToday && styles.selectedCircle,
				]}
			>
				<Text
					style={[
						styles.dayText,
						!day.isCurrentMonth && styles.otherMonthText,
						day.isToday && styles.todayText,
						isSelected && !day.isToday && styles.selectedText,
					]}
				>
					{day.day}
				</Text>
			</View>
			{hasEvents && <View style={styles.eventDot} />}
		</Pressable>
	);
});

const styles = StyleSheet.create({
	cell: {
		width: CELL_SIZE,
		height: CELL_SIZE,
		alignItems: "center",
		justifyContent: "center",
	},
	dayCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	todayCircle: {
		backgroundColor: "#F97316",
	},
	selectedCircle: {
		borderWidth: 1.5,
		borderColor: "#F97316",
	},
	dayText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#171717",
	},
	otherMonthText: {
		color: "#D4D4D4",
	},
	todayText: {
		color: "#FFFFFF",
		fontWeight: "700",
	},
	selectedText: {
		color: "#F97316",
	},
	eventDot: {
		width: 4,
		height: 4,
		borderRadius: 2,
		backgroundColor: "#F97316",
		marginTop: 2,
	},
});
