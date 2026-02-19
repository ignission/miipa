import { StyleSheet, Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { EventCard } from "./EventCard";

/** 日別イベントリストコンポーネントのProps */
interface DayEventListProps {
	/** 表示するイベントの配列 */
	events: UICalendarEvent[];
	/** 日付ラベル（例: 「今日 2/19（木）」） */
	dateLabel: string;
}

/**
 * 日別イベントリストコンポーネント
 *
 * 選択された日付のイベント一覧を表示します。
 * イベントがない場合は「予定はありません」メッセージを表示します。
 */
export function DayEventList({ events, dateLabel }: DayEventListProps) {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerText}>{dateLabel}</Text>
				<Text style={styles.countText}>
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
		flex: 1,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: "#FAFAFA",
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F5",
	},
	headerText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#404040",
	},
	countText: {
		fontSize: 12,
		color: "#A3A3A3",
	},
	empty: {
		paddingHorizontal: 16,
		paddingVertical: 24,
	},
	emptyText: {
		fontSize: 13,
		color: "#D4D4D4",
		textAlign: "center",
	},
});
