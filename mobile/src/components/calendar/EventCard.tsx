import { Text, View } from "react-native";
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
 *
 * カレンダーイベントをカード形式で表示します。
 * カレンダー色のインジケータ、時刻、タイトル、場所、ソース情報を表示します。
 * 終日イベントはアクセントカラー背景で区別されます。
 */
export function EventCard({ event, color }: EventCardProps) {
	const calendarColor = color ?? event.color ?? DEFAULT_CALENDAR_COLOR;

	return (
		<View
			className={`mx-4 my-1 flex-row overflow-hidden rounded-xl shadow-sm ${
				event.isAllDay ? "border border-dashed border-accent-200 bg-accent-50" : "bg-bg"
			}`}
			style={
				// Android 用 elevation
				!event.isAllDay ? { elevation: 1 } : undefined
			}
		>
			{/* カレンダー色インジケータ */}
			<View className="w-1" style={{ backgroundColor: calendarColor }} />

			<View className="flex-1 p-3">
				{/* 時刻 */}
				<Text className="mb-0.5 text-xs text-fg-muted">
					{event.isAllDay
						? "終日"
						: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
				</Text>

				{/* タイトル */}
				<Text className="mb-1 text-[15px] font-semibold text-fg" numberOfLines={2}>
					{event.title}
				</Text>

				{/* 場所 */}
				{event.location && (
					<Text className="mb-0.5 text-xs text-fg-muted" numberOfLines={1}>
						📍 {event.location}
					</Text>
				)}

				{/* ソース情報 */}
				<Text className="text-[11px] text-fg-subtle" numberOfLines={1}>
					{event.source.type === "google"
						? `✉️ ${event.source.accountEmail ?? event.source.calendarName}`
						: `📅 ${event.source.calendarName}`}
				</Text>
			</View>
		</View>
	);
}
