import { Text, View } from "react-native";
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
 *
 * 日付ヘッダーとその日のイベント一覧を表示します。
 * 今日の場合はアクセントカラーで強調表示されます。
 */
export function DayGroup({ date, events, isToday }: DayGroupProps) {
	return (
		<View className="mb-4">
			{/* 日付ヘッダー */}
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
					{formatDate(date, isToday)}
				</Text>
				<Text className="text-xs text-fg-subtle">
					{events.length > 0 ? `${events.length}件` : "予定なし"}
				</Text>
			</View>

			{/* イベント一覧 */}
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
