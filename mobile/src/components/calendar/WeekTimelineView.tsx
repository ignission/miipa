import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import {
	DAY_MS,
	formatDateKey,
	formatSectionHeader,
	groupEventsByDate,
} from "../../lib/calendar-utils";
import { TimelineView } from "./TimelineView";

/** 表示日数 */
const DAYS_TO_SHOW = 7;

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

/** 週間タイムラインビュー（日付ごとのセクションヘッダー + TimelineView） */
export function WeekTimelineView({
	events,
	currentTime,
}: WeekTimelineViewProps) {
	const sections: DaySection[] = useMemo(() => {
		const todayKey = formatDateKey(currentTime);
		const grouped = groupEventsByDate(events);

		return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
			const date = new Date(currentTime.getTime() + i * DAY_MS);
			const key = formatDateKey(date);
			const dayEvents = grouped.get(key) ?? [];
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
