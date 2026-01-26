"use client";

/**
 * TodayWeekViewコンポーネント
 *
 * 今日/今週の予定を切り替えて表示するメインコンテナコンポーネントです。
 * ViewTabs、TodayView、WeekViewを統合し、タブ状態をlocalStorageで永続化します。
 *
 * @module components/calendar/TodayWeekView
 *
 * @example
 * ```tsx
 * <TodayWeekView />
 * ```
 */

import { useCallback, useEffect, useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { css } from "@/styled-system/css";
import { TodayView } from "./TodayView";
import { ViewTabs, type ViewType } from "./ViewTabs";
import { WeekView } from "./WeekView";

// ============================================================
// 定数
// ============================================================

/**
 * localStorageのキー
 */
const STORAGE_KEY = "soloday-view-tab";

/**
 * デフォルトのビュー
 */
const DEFAULT_VIEW: ViewType = "today";

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * localStorageからタブ状態を取得
 *
 * @returns 保存されているビュータイプ、または未設定の場合はデフォルト値
 */
function getStoredView(): ViewType {
	if (typeof window === "undefined") {
		return DEFAULT_VIEW;
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "today" || stored === "week") {
			return stored;
		}
	} catch {
		// localStorageへのアクセスに失敗した場合はデフォルト値を使用
	}

	return DEFAULT_VIEW;
}

/**
 * localStorageにタブ状態を保存
 *
 * @param view - 保存するビュータイプ
 */
function setStoredView(view: ViewType): void {
	if (typeof window === "undefined") {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, view);
	} catch {
		// localStorageへのアクセスに失敗した場合は無視
	}
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * 今日/今週の予定表示コンポーネント
 *
 * タブ切り替えで今日の予定と今週の予定を切り替えて表示します。
 * useEventsフックでデータを取得し、タブ状態はlocalStorageで永続化されます。
 *
 * @returns 今日/今週の予定表示要素
 */
export function TodayWeekView() {
	// タブ状態（初期値はSSR対応でデフォルト値を使用）
	const [activeView, setActiveView] = useState<ViewType>(DEFAULT_VIEW);
	const [isHydrated, setIsHydrated] = useState(false);

	// イベント取得フック
	const {
		events: todayEvents,
		isLoading: isTodayLoading,
		error: todayError,
		refresh: refreshToday,
		lastSync: todayLastSync,
	} = useEvents("today");

	const {
		events: weekEvents,
		isLoading: isWeekLoading,
		error: weekError,
		refresh: refreshWeek,
		lastSync: weekLastSync,
	} = useEvents("week");

	// クライアントサイドでのみlocalStorageから状態を復元
	useEffect(() => {
		setActiveView(getStoredView());
		setIsHydrated(true);
	}, []);

	/**
	 * ビュー切り替え処理
	 */
	const handleViewChange = useCallback((view: ViewType) => {
		setActiveView(view);
		setStoredView(view);
	}, []);

	/**
	 * 更新処理
	 */
	const handleRefresh = useCallback(() => {
		if (activeView === "today") {
			refreshToday();
		} else {
			refreshWeek();
		}
	}, [activeView, refreshToday, refreshWeek]);

	// useEventsは既にUI表示用の形式（UICalendarEvent）を返すため、直接使用可能
	const displayTodayEvents = todayEvents;
	const displayWeekEvents = weekEvents;

	// ハイドレーション前は最小限のUIを表示
	if (!isHydrated) {
		return (
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "6",
					width: "100%",
					maxWidth: "2xl",
					mx: "auto",
					p: "4",
				})}
				aria-busy="true"
			>
				<div
					className={css({
						height: "10",
						bg: "bg.muted",
						borderRadius: "lg",
						animation: "pulse 1.5s ease-in-out infinite",
					})}
				/>
			</div>
		);
	}

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "6",
				width: "100%",
				maxWidth: "2xl",
				mx: "auto",
				p: "4",
			})}
		>
			{/* タブ切り替え */}
			<div
				className={css({
					display: "flex",
					justifyContent: "center",
				})}
			>
				<ViewTabs activeView={activeView} onViewChange={handleViewChange} />
			</div>

			{/* タブコンテンツ */}
			<div
				role="tabpanel"
				id={`tabpanel-${activeView}`}
				aria-labelledby={`tab-${activeView}`}
				className={css({
					minHeight: "64",
				})}
			>
				{activeView === "today" ? (
					<TodayView
						events={displayTodayEvents}
						isLoading={isTodayLoading}
						error={todayError}
						onRefresh={handleRefresh}
						lastSync={todayLastSync}
					/>
				) : (
					<WeekView
						events={displayWeekEvents}
						isLoading={isWeekLoading}
						error={weekError}
						onRefresh={handleRefresh}
						lastSync={weekLastSync}
					/>
				)}
			</div>
		</div>
	);
}
