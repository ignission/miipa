import { StyleSheet, Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { DEFAULT_CALENDAR_COLOR } from "../../theme";

interface EventCardProps {
	event: UICalendarEvent;
	color?: string;
}

/**
 * 時刻フォーマット（HH:MM）
 */
function formatTime(date: Date): string {
	return date.toLocaleTimeString("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/**
 * イベントカードコンポーネント
 */
export function EventCard({ event, color }: EventCardProps) {
	const calendarColor = color ?? event.color ?? DEFAULT_CALENDAR_COLOR;

	return (
		<View style={[styles.card, event.isAllDay && styles.allDayCard]}>
			{/* カレンダー色インジケータ */}
			<View style={[styles.colorBar, { backgroundColor: calendarColor }]} />

			<View style={styles.content}>
				{/* 時刻 */}
				<Text style={styles.time}>
					{event.isAllDay
						? "終日"
						: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
				</Text>

				{/* タイトル */}
				<Text style={styles.title} numberOfLines={2}>
					{event.title}
				</Text>

				{/* 場所 */}
				{event.location && (
					<Text style={styles.location} numberOfLines={1}>
						📍 {event.location}
					</Text>
				)}

				{/* ソース情報 */}
				<Text style={styles.source} numberOfLines={1}>
					{event.source.type === "google"
						? `✉️ ${event.source.accountEmail ?? event.source.calendarName}`
						: `📅 ${event.source.calendarName}`}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		backgroundColor: "#fff",
		borderRadius: 12,
		marginHorizontal: 16,
		marginVertical: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
		elevation: 1,
		overflow: "hidden",
	},
	allDayCard: {
		backgroundColor: "#FFFBF0",
		borderWidth: 1,
		borderColor: "#FED7AA",
		borderStyle: "dashed",
	},
	colorBar: {
		width: 4,
	},
	content: {
		flex: 1,
		padding: 12,
	},
	time: {
		fontSize: 12,
		color: "#737373",
		marginBottom: 2,
	},
	title: {
		fontSize: 15,
		fontWeight: "600",
		color: "#171717",
		marginBottom: 4,
	},
	location: {
		fontSize: 12,
		color: "#737373",
		marginBottom: 2,
	},
	source: {
		fontSize: 11,
		color: "#A3A3A3",
	},
});
