import { StyleSheet, Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { DEFAULT_CALENDAR_COLOR } from "../../theme";

const HOUR_HEIGHT = 60;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
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
 * イベントのY座標を計算
 */
function getEventPosition(event: UICalendarEvent): {
	top: number;
	height: number;
} {
	const startHour =
		event.startTime.getHours() + event.startTime.getMinutes() / 60;
	const rawEndHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;
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
 */
export function TimelineView({ events, currentTime }: TimelineViewProps) {
	// 終日でないイベントのうち、表示時間帯（DAY_START_HOUR〜DAY_END_HOUR）と
	// 重なるもののみ表示する。範囲外イベントのゴーストブロック描画を防止する。
	const timeEvents = events.filter((e) => {
		if (e.isAllDay) return false;
		const startHour = e.startTime.getHours() + e.startTime.getMinutes() / 60;
		const rawEndHour = e.endTime.getHours() + e.endTime.getMinutes() / 60;
		// 深夜跨ぎ（例: 23:00→翌01:00）の場合、表示範囲の終端まで表示する
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
			{/* 終日イベント */}
			{allDayEvents.length > 0 && (
				<View style={styles.allDaySection}>
					<Text style={styles.allDayLabel}>終日</Text>
					{allDayEvents.map((event) => (
						<View
							key={event.id}
							style={[
								styles.allDayEvent,
								{
									backgroundColor:
										(event.color ?? DEFAULT_CALENDAR_COLOR) + "20",
									borderLeftColor: event.color ?? DEFAULT_CALENDAR_COLOR,
								},
							]}
						>
							<Text style={styles.allDayEventText} numberOfLines={1}>
								{event.title}
							</Text>
						</View>
					))}
				</View>
			)}

			{/* タイムライングリッド */}
			<View style={[styles.timeline, { height: hours.length * HOUR_HEIGHT }]}>
				{/* 時刻ラベルとグリッド線 */}
				{hours.map((hour) => (
					<View
						key={hour}
						style={[
							styles.hourRow,
							{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT },
						]}
					>
						<Text style={styles.hourLabel}>{formatHourLabel(hour)}</Text>
						<View style={styles.hourLine} />
					</View>
				))}

				{/* 現在時刻インジケータ */}
				{showIndicator && (
					<View style={[styles.currentTimeIndicator, { top: indicatorTop }]}>
						<View style={styles.currentTimeDot} />
						<View style={styles.currentTimeLine} />
					</View>
				)}

				{/* イベント */}
				{timeEvents.map((event) => {
					const { top, height } = getEventPosition(event);
					const eventColor = event.color ?? DEFAULT_CALENDAR_COLOR;

					return (
						<View
							key={event.id}
							style={[
								styles.event,
								{
									top,
									height,
									left: TIME_LABEL_WIDTH + 4,
									backgroundColor: eventColor + "20",
									borderLeftColor: eventColor,
								},
							]}
						>
							<Text style={styles.eventTime} numberOfLines={1}>
								{event.startTime.toLocaleTimeString("ja-JP", {
									hour: "2-digit",
									minute: "2-digit",
									hour12: false,
								})}
							</Text>
							<Text style={styles.eventTitle} numberOfLines={2}>
								{event.title}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	allDaySection: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: "#FAFAFA",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5E5",
	},
	allDayLabel: {
		fontSize: 12,
		color: "#737373",
		marginBottom: 4,
	},
	allDayEvent: {
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 6,
		borderLeftWidth: 3,
		marginBottom: 4,
	},
	allDayEventText: {
		fontSize: 13,
		fontWeight: "500",
		color: "#171717",
	},
	timeline: {
		position: "relative",
		marginTop: 8,
	},
	hourRow: {
		position: "absolute",
		left: 0,
		right: 0,
		flexDirection: "row",
		alignItems: "flex-start",
	},
	hourLabel: {
		width: TIME_LABEL_WIDTH,
		fontSize: 11,
		color: "#A3A3A3",
		textAlign: "right",
		paddingRight: 8,
		marginTop: -6,
	},
	hourLine: {
		flex: 1,
		height: 1,
		backgroundColor: "#E5E5E5",
	},
	currentTimeIndicator: {
		position: "absolute",
		left: TIME_LABEL_WIDTH - 4,
		right: 0,
		flexDirection: "row",
		alignItems: "center",
		zIndex: 10,
	},
	currentTimeDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#EF4444",
	},
	currentTimeLine: {
		flex: 1,
		height: 2,
		backgroundColor: "#EF4444",
	},
	event: {
		position: "absolute",
		right: 16,
		borderLeftWidth: 3,
		borderRadius: 6,
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	eventTime: {
		fontSize: 10,
		color: "#737373",
	},
	eventTitle: {
		fontSize: 12,
		fontWeight: "500",
		color: "#171717",
	},
});
