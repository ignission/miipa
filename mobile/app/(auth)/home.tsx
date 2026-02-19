/**
 * 今日の予定画面
 *
 * 認証済みユーザーのメイン画面です。
 * Web用のレイアウト調整（max-width, padding等）を含みます。
 * 未認証WebアクセスではLPコンポーネントを条件表示します。
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
import { TimelineView } from "../../src/components/calendar/TimelineView";
import {
	ViewTabs,
	type ViewType,
} from "../../src/components/calendar/view-tabs";
import { useEvents } from "../../src/hooks/useEvents";
import { useWidgetData } from "../../src/hooks/useWidgetData";

export default function TodayScreen() {
	const [activeView, setActiveView] = useState<ViewType>("today");
	const { events, isLoading, isRefreshing, error, lastSync, refresh } =
		useEvents(activeView === "today" ? "today" : "week");

	// Widget & Watch データ同期（Mobileのみ）
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

	/**
	 * ビュー切り替え時のハンドラ
	 */
	const handleViewChange = useCallback((view: ViewType) => {
		setActiveView(view);
	}, []);

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center p-6">
				<ActivityIndicator size="large" color="#F97316" />
				<Text className="mt-3 text-sm text-neutral-500">読み込み中...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View className="flex-1 items-center justify-center p-6">
				<Text className="mb-3 text-3xl">(; _ ;)</Text>
				<Text className="mb-1 text-base font-semibold text-neutral-900">
					読み込みに失敗しました
				</Text>
				<Text className="text-sm text-neutral-500">{error.message}</Text>
			</View>
		);
	}

	return (
		<ScrollView
			className="flex-1 bg-white"
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
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
				{/* ViewTabs（今日/今週切り替え） */}
				<View className="items-center px-4 py-3">
					<ViewTabs activeView={activeView} onViewChange={handleViewChange} />
				</View>

				{/* ヘッダー */}
				<View className="px-4 pb-2 pt-3">
					<Text className="text-base font-semibold text-neutral-900">
						{currentTime.toLocaleDateString("ja-JP", {
							year: "numeric",
							month: "long",
							day: "numeric",
							weekday: "long",
						})}
					</Text>
					{lastSync && (
						<Text className="mt-0.5 text-xs text-neutral-400">
							最終更新:{" "}
							{lastSync.toLocaleTimeString("ja-JP", {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Text>
					)}
				</View>

				{events.length === 0 ? (
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
				) : (
					<TimelineView events={events} currentTime={currentTime} />
				)}
			</View>
		</ScrollView>
	);
}
