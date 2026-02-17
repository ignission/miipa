import { useCallback, useMemo } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { EventCard } from "../../src/components/calendar/EventCard";
import type { UICalendarEvent } from "../../src/hooks/useEvents";
import { useEvents } from "../../src/hooks/useEvents";

const DAYS_TO_SHOW = 7;

/**
 * 日付キー（YYYY-MM-DD）を生成
 */
function formatDateKey(date: Date): string {
	const y = date.getFullYear();
	const m = (date.getMonth() + 1).toString().padStart(2, "0");
	const d = date.getDate().toString().padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/**
 * 日付ヘッダーのフォーマット
 */
function formatSectionHeader(date: Date, isToday: boolean): string {
	const weekday = date.toLocaleDateString("ja-JP", { weekday: "short" });
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return isToday
		? `今日 ${month}/${day}（${weekday}）`
		: `${month}/${day}（${weekday}）`;
}

/** 予定なしのプレースホルダー型 */
interface EmptyPlaceholder {
	_empty: true;
	/** セクション間で一意となるキー */
	key: string;
}

/** SectionListのセクションデータ型（予定なしの日は EmptyPlaceholder を含む） */
type SectionItem = UICalendarEvent | EmptyPlaceholder;

interface Section {
	title: string;
	isToday: boolean;
	eventCount: number;
	data: SectionItem[];
}

export default function WeekScreen() {
	const { events, isLoading, isRefreshing, error, lastSync, refresh } =
		useEvents("week");

	const onRefresh = useCallback(async () => {
		await refresh();
	}, [refresh]);

	// イベントを日付ごとにセクション化
	const sections: Section[] = useMemo(() => {
		const today = new Date();
		const todayKey = formatDateKey(today);

		// イベントを日付でグルーピング
		const grouped = new Map<string, UICalendarEvent[]>();
		for (const event of events) {
			const key = formatDateKey(event.startTime);
			const list = grouped.get(key) ?? [];
			list.push(event);
			grouped.set(key, list);
		}

		// 7日分のセクションを生成
		return Array.from({ length: DAYS_TO_SHOW }, (_, i) => {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			const key = formatDateKey(date);
			const dayEvents = grouped.get(key) ?? [];
			const isToday = key === todayKey;

			return {
				title: formatSectionHeader(date, isToday),
				isToday,
				eventCount: dayEvents.length,
				// 予定なしの日は日付キーを含む一意のプレースホルダーを設定
				data:
					dayEvents.length > 0
						? dayEvents
						: [{ _empty: true as const, key: `empty-${key}` }],
			};
		});
	}, [events]);

	if (isLoading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color="#F97316" />
				<Text style={styles.loadingText}>読み込み中...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.center}>
				<Text style={styles.errorEmoji}>(; _ ;)</Text>
				<Text style={styles.errorText}>読み込みに失敗しました</Text>
			</View>
		);
	}

	return (
		<SectionList
			style={styles.container}
			sections={sections}
			keyExtractor={(item: SectionItem) =>
				"_empty" in item ? item.key : item.id
			}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					tintColor="#F97316"
				/>
			}
			ListHeaderComponent={
				lastSync ? (
					<View style={styles.syncHeader}>
						<Text style={styles.syncLabel}>
							最終更新:{" "}
							{lastSync.toLocaleTimeString("ja-JP", {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					</View>
				) : null
			}
			renderSectionHeader={({ section }) => (
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
						{section.eventCount > 0 ? `${section.eventCount}件` : "予定なし"}
					</Text>
				</View>
			)}
			renderItem={({ item }: { item: SectionItem }) => {
				if ("_empty" in item) {
					return (
						<View style={styles.emptyDay}>
							<Text style={styles.emptyDayText}>予定はありません</Text>
						</View>
					);
				}
				return <EventCard event={item} />;
			}}
			stickySectionHeadersEnabled
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 14,
		color: "#737373",
	},
	errorEmoji: {
		fontSize: 32,
		marginBottom: 12,
	},
	errorText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#171717",
	},
	syncHeader: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	syncLabel: {
		fontSize: 11,
		color: "#A3A3A3",
	},
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
