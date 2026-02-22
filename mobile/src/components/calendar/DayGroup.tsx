import { StyleSheet, Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { EventCard } from "./EventCard";

/** 表示バリアント */
type DayGroupVariant = "timeline" | "monthDetail";

interface DayGroupProps {
	/** 対象日付 */
	date: Date;
	/** 表示するイベントの配列 */
	events: UICalendarEvent[];
	/** 今日かどうか */
	isToday: boolean;
	/**
	 * 表示バリアント
	 * - "timeline": タイムライン表示（NativeWind、isTodayでアクセント強調）
	 * - "monthDetail": 月カレンダーの日別詳細表示（背景色・ボーダー付き）
	 * @default "timeline"
	 */
	variant?: DayGroupVariant;
}

function formatDate(date: Date, isToday: boolean): string {
	const weekday = date.toLocaleDateString("ja-JP", { weekday: "short" });
	const month = date.getMonth() + 1;
	const day = date.getDate();

	if (isToday) {
		return `今日 ${month}/${day}（${weekday}）`;
	}
	return `${month}/${day}（${weekday}）`;
}

/** 日別イベントグループ（日付ヘッダー + イベント一覧） */
export function DayGroup({
	date,
	events,
	isToday,
	variant = "timeline",
}: DayGroupProps) {
	const dateLabel = formatDate(date, isToday);

	if (variant === "monthDetail") {
		return (
			<View style={monthDetailStyles.container}>
				<View style={monthDetailStyles.header}>
					<Text style={monthDetailStyles.headerText}>{dateLabel}</Text>
					<Text style={monthDetailStyles.countText}>
						{events.length > 0 ? `${events.length}件` : "予定なし"}
					</Text>
				</View>
				{events.length > 0 ? (
					events.map((event) => <EventCard key={event.id} event={event} />)
				) : (
					<View style={monthDetailStyles.empty}>
						<Text style={monthDetailStyles.emptyText}>予定はありません</Text>
					</View>
				)}
			</View>
		);
	}

	return (
		<View className="mb-4">
			<View
				className={`flex-row items-center justify-between px-4 py-2 ${
					isToday ? "mx-2 rounded-lg bg-accent-50" : ""
				}`}
			>
				<Text
					className={`text-[15px] font-semibold ${
						isToday ? "text-accent-600" : "text-fg"
					}`}
				>
					{dateLabel}
				</Text>
				<Text className="text-xs text-fg-subtle">
					{events.length > 0 ? `${events.length}件` : "予定なし"}
				</Text>
			</View>

			{events.length > 0 ? (
				events.map((event) => <EventCard key={event.id} event={event} />)
			) : (
				<View className="px-4 py-3">
					<Text className="text-center text-[13px] text-border">
						予定はありません
					</Text>
				</View>
			)}
		</View>
	);
}

/** monthDetail バリアント用スタイル */
const monthDetailStyles = StyleSheet.create({
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
