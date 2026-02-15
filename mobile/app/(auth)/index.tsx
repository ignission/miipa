import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useEvents } from "../../src/hooks/useEvents";
import { useWidgetData } from "../../src/hooks/useWidgetData";
import { TimelineView } from "../../src/components/calendar/TimelineView";
import { EventCard } from "../../src/components/calendar/EventCard";

export default function TodayScreen() {
	const { events, isLoading, isRefreshing, error, lastSync, refresh } =
		useEvents("today");

	// Widget & Watch データ同期
	useWidgetData(events);

	const [currentTime, setCurrentTime] = useState(new Date());

	// 現在時刻を毎分更新
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 60_000);
		return () => clearInterval(timer);
	}, []);

	const onRefresh = useCallback(async () => {
		await refresh();
	}, [refresh]);

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
				<Text style={styles.errorDetail}>{error.message}</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					tintColor="#F97316"
				/>
			}
		>
			{/* ヘッダー */}
			<View style={styles.header}>
				<Text style={styles.dateLabel}>
					{currentTime.toLocaleDateString("ja-JP", {
						year: "numeric",
						month: "long",
						day: "numeric",
						weekday: "long",
					})}
				</Text>
				{lastSync && (
					<Text style={styles.syncLabel}>
						最終更新:{" "}
						{lastSync.toLocaleTimeString("ja-JP", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</Text>
				)}
			</View>

			{events.length === 0 ? (
				<View style={styles.empty}>
					<Text style={styles.emptyEmoji}>( ^ o ^ )</Text>
					<Text style={styles.emptyText}>
						今日の予定はありません
					</Text>
					<Text style={styles.emptySubtext}>
						ゆっくり過ごしましょう
					</Text>
				</View>
			) : (
				<TimelineView events={events} currentTime={currentTime} />
			)}
		</ScrollView>
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
		marginBottom: 4,
	},
	errorDetail: {
		fontSize: 13,
		color: "#737373",
	},
	header: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 8,
	},
	dateLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "#171717",
	},
	syncLabel: {
		fontSize: 11,
		color: "#A3A3A3",
		marginTop: 2,
	},
	empty: {
		alignItems: "center",
		paddingTop: 80,
	},
	emptyEmoji: {
		fontSize: 48,
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#404040",
		marginBottom: 4,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#A3A3A3",
	},
});
