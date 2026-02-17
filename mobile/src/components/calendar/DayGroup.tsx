import { StyleSheet, Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { EventCard } from "./EventCard";

interface DayGroupProps {
	date: Date;
	events: UICalendarEvent[];
	isToday: boolean;
}

/**
 * 日付のフォーマット
 */
function formatDate(date: Date, isToday: boolean): string {
	const weekday = date.toLocaleDateString("ja-JP", { weekday: "short" });
	const month = date.getMonth() + 1;
	const day = date.getDate();

	if (isToday) {
		return `今日 ${month}/${day}（${weekday}）`;
	}
	return `${month}/${day}（${weekday}）`;
}

/**
 * 日別イベントグループコンポーネント
 */
export function DayGroup({ date, events, isToday }: DayGroupProps) {
	return (
		<View style={styles.container}>
			<View style={[styles.header, isToday && styles.todayHeader]}>
				<Text style={[styles.dateText, isToday && styles.todayDateText]}>
					{formatDate(date, isToday)}
				</Text>
				<Text style={styles.eventCount}>
					{events.length > 0 ? `${events.length}件` : "予定なし"}
				</Text>
			</View>

			{events.length > 0 ? (
				events.map((event) => <EventCard key={event.id} event={event} />)
			) : (
				<View style={styles.empty}>
					<Text style={styles.emptyText}>予定はありません</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	todayHeader: {
		backgroundColor: "#FFF7ED",
		borderRadius: 8,
		marginHorizontal: 8,
	},
	dateText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#404040",
	},
	todayDateText: {
		color: "#EA580C",
	},
	eventCount: {
		fontSize: 12,
		color: "#A3A3A3",
	},
	empty: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	emptyText: {
		fontSize: 13,
		color: "#D4D4D4",
		textAlign: "center",
	},
});
