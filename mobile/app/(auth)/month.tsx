import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { MonthView } from "../../src/components/calendar/MonthView";
import { useMonthEvents } from "../../src/hooks/useMonthEvents";

function getInitialYearMonth(): { year: number; month: number } {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * 月表示スクリーン
 *
 * 月カレンダーの画面コンポーネントです。
 * 年月の状態管理、イベント取得、プルトゥリフレッシュ、
 * ローディング/エラー表示を統合します。
 */
export default function MonthScreen() {
	const [{ year, month }, setYearMonth] = useState(getInitialYearMonth);

	const { events, isLoading, isRefreshing, error, lastSync, refresh } =
		useMonthEvents(year, month);

	const onRefresh = useCallback(async () => {
		await refresh();
	}, [refresh]);

	const handlePrevMonth = useCallback(() => {
		setYearMonth((prev) => {
			if (prev.month === 1) {
				return { year: prev.year - 1, month: 12 };
			}
			return { year: prev.year, month: prev.month - 1 };
		});
	}, []);

	const handleNextMonth = useCallback(() => {
		setYearMonth((prev) => {
			if (prev.month === 12) {
				return { year: prev.year + 1, month: 1 };
			}
			return { year: prev.year, month: prev.month + 1 };
		});
	}, []);

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
		<ScrollView
			style={styles.container}
			contentContainerStyle={{ flexGrow: 1 }}
			alwaysBounceVertical
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					tintColor="#F97316"
				/>
			}
		>
			{lastSync && (
				<View style={styles.syncHeader}>
					<Text style={styles.syncLabel}>
						最終更新:{" "}
						{lastSync.toLocaleTimeString("ja-JP", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</Text>
				</View>
			)}
			<MonthView
				year={year}
				month={month}
				events={events}
				onPrevMonth={handlePrevMonth}
				onNextMonth={handleNextMonth}
			/>
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
	},
	syncHeader: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	syncLabel: {
		fontSize: 11,
		color: "#A3A3A3",
	},
});
