import { Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { DEFAULT_CALENDAR_COLOR } from "../../theme";

/** 1時間あたりの高さ（px） */
const HOUR_HEIGHT = 60;
/** 表示開始時刻 */
const DAY_START_HOUR = 6;
/** 表示終了時刻 */
const DAY_END_HOUR = 22;
/** 時刻ラベルの幅 */
const TIME_LABEL_WIDTH = 50;

interface TimelineViewProps {
	events: UICalendarEvent[];
	currentTime: Date;
}

/**
 * 時刻ラベルのフォーマット
 */
function formatHourLabel(hour: number): string {
	return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * イベントのY座標と高さを計算
 */
function getEventPosition(event: UICalendarEvent): {
	top: number;
	height: number;
} {
	const startHour =
		event.startTime.getHours() + event.startTime.getMinutes() / 60;
	const rawEndHour =
		event.endTime.getHours() + event.endTime.getMinutes() / 60;
	// 深夜跨ぎ（例: 23:00→翌01:00）の場合、表示範囲の終端まで描画する
	const endHour = rawEndHour < startHour ? DAY_END_HOUR : rawEndHour;

	const clampedStart = Math.max(startHour, DAY_START_HOUR);
	const clampedEnd = Math.min(endHour, DAY_END_HOUR);

	const top = (clampedStart - DAY_START_HOUR) * HOUR_HEIGHT;
	const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 24);

	return { top, height };
}

/**
 * タイムラインビューコンポーネント
 *
 * 時間軸に沿ってイベントをブロック表示するビューです。
 * 終日イベントは上部に別セクションとして表示します。
 * 現在時刻のインジケータ（赤い線）も表示されます。
 *
 * 注意: 複雑な絶対配置レイアウトのため、一部のスタイルは
 * style prop で直接指定しています（動的な top/height/left 値）。
 */
export function TimelineView({ events, currentTime }: TimelineViewProps) {
	// 終日でないイベントのうち、表示時間帯と重なるもののみ表示する
	const timeEvents = events.filter((e) => {
		if (e.isAllDay) return false;
		const startHour = e.startTime.getHours() + e.startTime.getMinutes() / 60;
		const rawEndHour = e.endTime.getHours() + e.endTime.getMinutes() / 60;
		// 深夜跨ぎの場合、表示範囲の終端まで表示する
		const endHour = rawEndHour < startHour ? DAY_END_HOUR : rawEndHour;
		return endHour > DAY_START_HOUR && startHour < DAY_END_HOUR;
	});
	const allDayEvents = events.filter((e) => e.isAllDay);

	const hours = Array.from(
		{ length: DAY_END_HOUR - DAY_START_HOUR },
		(_, i) => DAY_START_HOUR + i,
	);

	// 現在時刻のインジケータ位置
	const now = currentTime.getHours() + currentTime.getMinutes() / 60;
	// DAY_END_HOUR丁度ではコンテナ境界にはみ出すため厳密な不等号を使用
	const showIndicator = now >= DAY_START_HOUR && now < DAY_END_HOUR;
	const indicatorTop = (now - DAY_START_HOUR) * HOUR_HEIGHT;

	return (
		<View>
			{/* 終日イベントセクション */}
			{allDayEvents.length > 0 && (
				<View className="border-b border-bg-muted bg-bg-subtle px-4 py-2">
					<Text className="mb-1 text-xs text-fg-muted">終日</Text>
					{allDayEvents.map((event) => (
						<View
							key={event.id}
							className="mb-1 rounded-md px-2 py-1.5"
							style={{
								backgroundColor:
									`${event.color ?? DEFAULT_CALENDAR_COLOR}20`,
								borderLeftWidth: 3,
								borderLeftColor: event.color ?? DEFAULT_CALENDAR_COLOR,
							}}
						>
							<Text
								className="text-[13px] font-medium text-fg"
								numberOfLines={1}
							>
								{event.title}
							</Text>
						</View>
					))}
				</View>
			)}

			{/* タイムライングリッド */}
			<View
				className="relative mt-2"
				style={{ height: hours.length * HOUR_HEIGHT }}
			>
				{/* 時刻ラベルとグリッド線 */}
				{hours.map((hour) => (
					<View
						key={hour}
						className="absolute left-0 right-0 flex-row items-start"
						style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
					>
						<Text
							className="text-right text-[11px] text-fg-subtle"
							style={{
								width: TIME_LABEL_WIDTH,
								paddingRight: 8,
								marginTop: -6,
							}}
						>
							{formatHourLabel(hour)}
						</Text>
						<View className="h-px flex-1 bg-bg-muted" />
					</View>
				))}

				{/* 現在時刻インジケータ */}
				{showIndicator && (
					<View
						className="absolute right-0 z-10 flex-row items-center"
						style={{ top: indicatorTop, left: TIME_LABEL_WIDTH - 4 }}
					>
						<View className="h-2 w-2 rounded-full bg-red-500" />
						<View className="h-0.5 flex-1 bg-red-500" />
					</View>
				)}

				{/* イベントブロック */}
				{timeEvents.map((event) => {
					const { top, height } = getEventPosition(event);
					const eventColor = event.color ?? DEFAULT_CALENDAR_COLOR;

					return (
						<View
							key={event.id}
							className="absolute right-4 rounded-md px-2 py-1"
							style={{
								top,
								height,
								left: TIME_LABEL_WIDTH + 4,
								backgroundColor: `${eventColor}20`,
								borderLeftWidth: 3,
								borderLeftColor: eventColor,
							}}
						>
							<Text className="text-[10px] text-fg-muted" numberOfLines={1}>
								{event.startTime.toLocaleTimeString("ja-JP", {
									hour: "2-digit",
									minute: "2-digit",
									hour12: false,
								})}
							</Text>
							<Text
								className="text-xs font-medium text-fg"
								numberOfLines={2}
							>
								{event.title}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}
