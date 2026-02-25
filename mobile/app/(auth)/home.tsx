/**
 * ホーム画面
 *
 * 認証済みユーザーのメイン画面です。
 * 今日 / 今週 / 月 の3ビューをViewTabsで切り替えます。
 *
 * @module app/(auth)/home
 */

import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { MonthView } from "../../src/components/calendar/MonthView";
import { TimelineView } from "../../src/components/calendar/TimelineView";
import {
	ViewTabs,
	type ViewType,
} from "../../src/components/calendar/view-tabs";
import { WeekTimelineView } from "../../src/components/calendar/WeekTimelineView";
import { useEvents } from "../../src/hooks/useEvents";
import { useMonthEvents } from "../../src/hooks/useMonthEvents";
import { useWidgetData } from "../../src/hooks/useWidgetData";

function getInitialYearMonth(): { year: number; month: number } {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function LastSyncText({ lastSync }: { lastSync: Date }) {
	return (
		<Text className="text-xs text-neutral-400">
			最終更新:{" "}
			{lastSync.toLocaleTimeString("ja-JP", {
				hour: "2-digit",
				minute: "2-digit",
			})}
		</Text>
	);
}

export default function TodayScreen() {
	const [activeView, setActiveView] = useState<ViewType>("today");

	// 月ビュー用ステート
	const [{ year: viewYear, month: viewMonth }, setYearMonth] =
		useState(getInitialYearMonth);

	// 今日/今週用イベント取得（month時はWidgetデータ同期のためtodayを取得）
	const eventsRange = activeView === "week" ? "week" : "today";
	const { events, isLoading, isRefreshing, error, lastSync, refresh } =
		useEvents(eventsRange);

	// Widget用weekデータ（常時取得）
	const {
		events: weekEventsForWidget,
		isLoading: isWidgetDataLoading,
		refresh: refreshWeek,
	} = useEvents("week");

	// 月イベント取得（Hooksルール準拠のため常に呼び出し）
	const {
		events: monthEvents,
		isLoading: isMonthLoading,
		isRefreshing: isMonthRefreshing,
		error: monthError,
		lastSync: monthLastSync,
		refresh: refreshMonth,
	} = useMonthEvents(viewYear, viewMonth);

	// Widget & Watch データ同期（Mobileのみ）
	useWidgetData(weekEventsForWidget, isWidgetDataLoading);

	const [currentTime, setCurrentTime] = useState(new Date());

	// 現在時刻を毎分更新
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 60_000);
		return () => clearInterval(timer);
	}, []);

	// 月ナビゲーション
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

	// リフレッシュ統一
	const onRefresh = useCallback(async () => {
		if (activeView === "month") {
			await refreshMonth();
		} else if (activeView === "week") {
			await refreshWeek();
		} else {
			await Promise.all([refresh(), refreshWeek()]);
		}
	}, [activeView, refresh, refreshWeek, refreshMonth]);

	const handleViewChange = useCallback((view: ViewType) => {
		setActiveView(view);
	}, []);

	// ビューに応じたローディング/エラー/最終更新の派生値
	const currentIsLoading = activeView === "month" ? isMonthLoading : isLoading;
	const currentError = activeView === "month" ? monthError : error;
	const currentLastSync = activeView === "month" ? monthLastSync : lastSync;
	const currentIsRefreshing =
		activeView === "month" ? isMonthRefreshing : isRefreshing;

	if (currentIsLoading) {
		return (
			<View className="flex-1 items-center justify-center p-6">
				<ActivityIndicator size="large" color="#F97316" />
				<Text className="mt-3 text-sm text-neutral-500">読み込み中...</Text>
			</View>
		);
	}

	if (currentError) {
		return (
			<View className="flex-1 items-center justify-center p-6">
				<Text className="mb-3 text-3xl">(; _ ;)</Text>
				<Text className="mb-1 text-base font-semibold text-neutral-900">
					読み込みに失敗しました
				</Text>
				<Text className="text-sm text-neutral-500">{currentError.message}</Text>
			</View>
		);
	}

	return (
		<ScrollView
			className="flex-1 bg-white"
			contentContainerStyle={{ flexGrow: 1 }}
			refreshControl={
				<RefreshControl
					refreshing={currentIsRefreshing}
					onRefresh={onRefresh}
					tintColor="#F97316"
				/>
			}
		>
			{/* Web用のコンテナ制約 */}
			<View
				className={`mx-auto w-full ${
					Platform.OS === "web" ? "max-w-2xl px-6 py-4" : ""
				}`}
			>
				{/* ViewTabs（今日/今週/月 切り替え） */}
				<View className="items-center px-4 py-3">
					<ViewTabs activeView={activeView} onViewChange={handleViewChange} />
				</View>

				{/* ヘッダー: 今日/今週ビューでは日付表示、月ビューではlastSyncのみ */}
				{activeView !== "month" && (
					<View className="px-4 pb-2 pt-3">
						<Text className="text-base font-semibold text-neutral-900">
							{currentTime.toLocaleDateString("ja-JP", {
								year: "numeric",
								month: "long",
								day: "numeric",
								weekday: "long",
							})}
						</Text>
						{currentLastSync && (
							<View className="mt-0.5">
								<LastSyncText lastSync={currentLastSync} />
							</View>
						)}
					</View>
				)}
				{activeView === "month" && currentLastSync && (
					<View className="px-4 pb-1">
						<LastSyncText lastSync={currentLastSync} />
					</View>
				)}

				{/* コンテンツ */}
				{activeView === "month" ? (
					<MonthView
						year={viewYear}
						month={viewMonth}
						events={monthEvents}
						onPrevMonth={handlePrevMonth}
						onNextMonth={handleNextMonth}
					/>
				) : events.length === 0 ? (
					<View className="items-center pt-20">
						<Text className="mb-4 text-5xl">( ^ o ^ )</Text>
						<Text className="mb-1 text-lg font-semibold text-neutral-700">
							{activeView === "today"
								? "今日の予定はありません"
								: "今週の予定はありません"}
						</Text>
						<Text className="text-sm text-neutral-400">
							ゆっくり過ごしましょう
						</Text>
					</View>
				) : activeView === "week" ? (
					<WeekTimelineView events={events} currentTime={currentTime} />
				) : (
					<TimelineView events={events} currentTime={currentTime} />
				)}
			</View>
		</ScrollView>
	);
}
