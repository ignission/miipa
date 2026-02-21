import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { formatDateKey } from "../../lib/calendar-utils";
import { TimelineView } from "./TimelineView";

/** 表示日数 */
const DAYS_TO_SHOW = 7;

/** 1日のミリ秒 */
const DAY_MS = 24 * 60 * 60 * 1000;

/** JSTオフセット（ミリ秒）: UTC+9 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** セクションデータ */
interface DaySection {
	dateKey: string;
	title: string;
	isToday: boolean;
	eventCount: number;
	events: UICalendarEvent[];
}

interface WeekTimelineViewProps {
	events: UICalendarEvent[];
	currentTime: Date;
}

/**
 * 日付ヘッダーのフォーマット（JST基準）
 *
 * 今日の場合は「今日 2/23（月）」、それ以外は「2/23（月）」形式で返す。
 */
function formatSectionHeader(date: Date, isToday: boolean): string {
	const jst = new Date(date.getTime() + JST_OFFSET_MS);
	const weekday = jst.toLocaleDateString("ja-JP", {
		weekday: "short",
		timeZone: "UTC",
	});
	const month = jst.getUTCMonth() + 1;
	const day = jst.getUTCDate();
	return isToday
		? `今日 ${month}/${day}（${weekday}）`
		: `${month}/${day}（${weekday}）`;
}

/**
 * 週間タイムラインビューコンポーネント
 *
 * 週間イベントを日付ごとにグルーピングし、
 * 各日をセクションヘッダー + TimelineView で描画します。
 * ScrollView 内部に配置されることを想定しています。
 */
export function WeekTimelineView({
	events,
	currentTime,
}: WeekTimelineViewProps) {
	const sections: DaySection[] = useMemo(() => {
		const todayKey = formatDateKey(currentTime);

		// イベントを日付キーでグルーピング（イミュータブル）
		const grouped = events.reduce<Record<string, UICalendarEvent[]>>(
			(acc, event) => {
				const key = formatDateKey(event.startTime);
				return { ...acc, [key]: [...(acc[key] ?? []), event] };
			},
			{},
		);

		// 7日分のセクションを生成
		return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
			const date = new Date(currentTime.getTime() + i * DAY_MS);
			const key = formatDateKey(date);
			const dayEvents = grouped[key] ?? [];
			const isToday = key === todayKey;

			return {
				dateKey: key,
				title: formatSectionHeader(date, isToday),
				isToday,
				eventCount: dayEvents.length,
				events: dayEvents,
			};
		});
	}, [events, currentTime]);

	return (
		<View>
			{sections.map((section) => (
				<View key={section.dateKey}>
					{/* セクションヘッダー */}
					<View
						style={[
							styles.sectionHeader,
							section.isToday && styles.todaySectionHeader,
						]}
					>
						<Text
							style={[
								styles.sectionTitle,
								section.isToday && styles.todaySectionTitle,
							]}
						>
							{section.title}
						</Text>
						<Text style={styles.sectionCount}>
							{section.eventCount > 0
								? `${section.eventCount}件`
								: "予定なし"}
						</Text>
					</View>
					{/* 日のコンテンツ */}
					{section.events.length > 0 ? (
						<TimelineView
							events={section.events}
							currentTime={currentTime}
						/>
					) : (
						<View style={styles.emptyDay}>
							<Text style={styles.emptyDayText}>
								予定はありません
							</Text>
						</View>
					)}
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 10,
		backgroundColor: "#FAFAFA",
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F5",
	},
	todaySectionHeader: {
		backgroundColor: "#FFF7ED",
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: "#404040",
	},
	todaySectionTitle: {
		color: "#EA580C",
	},
	sectionCount: {
		fontSize: 12,
		color: "#A3A3A3",
	},
	emptyDay: {
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	emptyDayText: {
		fontSize: 13,
		color: "#D4D4D4",
		textAlign: "center",
	},
});
