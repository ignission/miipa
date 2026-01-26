"use client";

/**
 * WeekViewコンポーネント
 *
 * 今週の予定を日別に表示するコンポーネントです。
 * DayGroupコンポーネントを使用して各日のイベントをグループ化して表示します。
 * 今日から7日間の予定を表示し、予定のない日も「予定なし」として表示します。
 *
 * @module components/calendar/WeekView
 *
 * @example
 * ```tsx
 * <WeekView
 *   events={weekEvents}
 *   isLoading={false}
 *   error={null}
 *   onRefresh={handleRefresh}
 *   lastSync={new Date()}
 * />
 * ```
 */

import { isToday } from "@/lib/utils/date";
import { css } from "@/styled-system/css";
import { DayGroup } from "./DayGroup";
import type { CalendarEvent } from "./EventList";
import { SyncStatusBadge } from "./SyncStatusBadge";

// ============================================================
// 型定義
// ============================================================

/**
 * WeekViewコンポーネントのProps
 */
interface WeekViewProps {
	/** 表示するイベントの配列 */
	events: CalendarEvent[];
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー状態 */
	error: Error | null;
	/** 更新ボタン押下時のコールバック */
	onRefresh: () => void;
	/** 最終同期日時 */
	lastSync: Date | null;
}

// ============================================================
// 定数
// ============================================================

/**
 * 表示する日数
 */
const DAYS_TO_SHOW = 7;

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * 今日から指定日数分のDateオブジェクト配列を生成
 *
 * @param days - 生成する日数
 * @returns Dateオブジェクトの配列
 */
function getWeekDates(days: number): Date[] {
	const dates: Date[] = [];
	const today = new Date();

	for (let i = 0; i < days; i++) {
		const date = new Date(today);
		date.setDate(today.getDate() + i);
		// 時刻をリセット
		date.setHours(0, 0, 0, 0);
		dates.push(date);
	}

	return dates;
}

/**
 * JSTタイムゾーン識別子
 */
const JST_TIMEZONE = "Asia/Tokyo";

/**
 * DateをYYYY-MM-DD形式の文字列に変換（JSTベース）
 *
 * @param date - 変換対象のDate
 * @returns YYYY-MM-DD形式の文字列
 */
function formatDateKey(date: Date): string {
	const formatter = new Intl.DateTimeFormat("ja-JP", {
		timeZone: JST_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const parts = formatter.formatToParts(date);
	const year = parts.find((p) => p.type === "year")?.value ?? "2026";
	const month = parts.find((p) => p.type === "month")?.value ?? "01";
	const day = parts.find((p) => p.type === "day")?.value ?? "01";
	return `${year}-${month}-${day}`;
}

/**
 * イベントを日付ごとにグループ化
 *
 * イベントの開始時刻を基準に、JSTベースで日付ごとにグループ化します。
 *
 * @param events - グループ化するイベントの配列
 * @returns 日付キーをキーとし、イベント配列を値とするオブジェクト
 */
function groupEventsByDateLocal(
	events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
	if (events.length === 0) {
		return {};
	}

	// イベントをまず開始時刻でソート
	const sortedEvents = [...events].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
	);

	// 日付ごとにグループ化
	const grouped: Record<string, CalendarEvent[]> = {};

	for (const event of sortedEvents) {
		const dateKey = formatDateKey(new Date(event.startTime));

		if (!grouped[dateKey]) {
			grouped[dateKey] = [];
		}

		grouped[dateKey].push(event);
	}

	return grouped;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * ローディングスピナーコンポーネント
 *
 * @returns スピナー要素
 */
function LoadingSpinner() {
	return (
		<output
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				py: "12",
				gap: "3",
			})}
			aria-label="読み込み中"
		>
			<div
				className={css({
					width: "8",
					height: "8",
					border: "2px solid",
					borderColor: "border.default",
					borderTopColor: "blue.500",
					borderRadius: "full",
					animation: "spin 1s linear infinite",
				})}
			/>
			<p
				className={css({
					color: "fg.muted",
					fontSize: "sm",
				})}
			>
				予定を読み込んでいます...
			</p>
		</output>
	);
}

/**
 * エラー表示コンポーネント
 *
 * @param props - コンポーネントのProps
 * @param props.error - エラーオブジェクト
 * @param props.onRetry - リトライ時のコールバック
 * @returns エラー表示要素
 */
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				py: "12",
				gap: "4",
				textAlign: "center",
			})}
			role="alert"
		>
			<div
				className={css({
					width: "12",
					height: "12",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bg: "red.50",
					borderRadius: "full",
				})}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className={css({
						width: "6",
						height: "6",
						color: "red.500",
					})}
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
						clipRule="evenodd"
					/>
				</svg>
			</div>
			<div>
				<p
					className={css({
						color: "fg.default",
						fontWeight: "medium",
						mb: "1",
					})}
				>
					予定の取得に失敗しました
				</p>
				<p
					className={css({
						color: "fg.muted",
						fontSize: "sm",
					})}
				>
					{error.message}
				</p>
			</div>
			<button
				type="button"
				onClick={onRetry}
				className={css({
					px: "4",
					py: "2",
					bg: "blue.500",
					color: "white",
					fontSize: "sm",
					fontWeight: "medium",
					borderRadius: "md",
					cursor: "pointer",
					transition: "background 0.2s",
					_hover: {
						bg: "blue.600",
					},
					_focus: {
						outline: "2px solid",
						outlineColor: "blue.500",
						outlineOffset: "2px",
					},
				})}
			>
				再試行
			</button>
		</div>
	);
}

/**
 * ヘッダーコンポーネント
 *
 * @param props - コンポーネントのProps
 * @param props.lastSync - 最終同期日時
 * @param props.onRefresh - 更新ボタン押下時のコールバック
 * @param props.isLoading - ローディング状態
 * @returns ヘッダー要素
 */
function WeekViewHeader({
	lastSync,
	onRefresh,
	isLoading,
}: {
	lastSync: Date | null;
	onRefresh: () => void;
	isLoading: boolean;
}) {
	return (
		<header
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				mb: "4",
			})}
		>
			<SyncStatusBadge lastSyncTime={lastSync ?? undefined} />
			<button
				type="button"
				onClick={onRefresh}
				disabled={isLoading}
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "1.5",
					px: "3",
					py: "1.5",
					fontSize: "sm",
					color: "fg.muted",
					bg: "transparent",
					border: "1px solid",
					borderColor: "border.default",
					borderRadius: "md",
					cursor: "pointer",
					transition: "all 0.2s",
					_hover: {
						bg: "bg.subtle",
						borderColor: "border.emphasized",
					},
					_disabled: {
						opacity: 0.5,
						cursor: "not-allowed",
					},
					_focus: {
						outline: "2px solid",
						outlineColor: "blue.500",
						outlineOffset: "2px",
					},
				})}
				aria-label="予定を更新"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className={css({
						width: "4",
						height: "4",
						animation: isLoading ? "spin 1s linear infinite" : "none",
					})}
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
						clipRule="evenodd"
					/>
				</svg>
				<span>更新</span>
			</button>
		</header>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * 今週の予定表示コンポーネント
 *
 * 今日から7日間の予定を日別に表示します。
 * DayGroupコンポーネントを使用して各日のイベントを表示します。
 * 予定のない日も表示され、ローディング/エラー状態にも対応しています。
 *
 * @param props - コンポーネントのProps
 * @param props.events - 表示するイベントの配列
 * @param props.isLoading - ローディング状態
 * @param props.error - エラー状態
 * @param props.onRefresh - 更新ボタン押下時のコールバック
 * @param props.lastSync - 最終同期日時
 * @returns 今週の予定表示要素
 */
export function WeekView({
	events,
	isLoading,
	error,
	onRefresh,
	lastSync,
}: WeekViewProps) {
	// 今日から7日間のDateを生成
	const weekDates = getWeekDates(DAYS_TO_SHOW);

	// イベントを日付ごとにグループ化
	const groupedEvents = groupEventsByDateLocal(events);

	// エラー状態の場合
	if (error) {
		return (
			<section aria-labelledby="week-view-heading">
				<h1 id="week-view-heading" className={css({ srOnly: true })}>
					今週の予定
				</h1>
				<ErrorState error={error} onRetry={onRefresh} />
			</section>
		);
	}

	// ローディング状態の場合
	if (isLoading && events.length === 0) {
		return (
			<section aria-labelledby="week-view-heading">
				<h1 id="week-view-heading" className={css({ srOnly: true })}>
					今週の予定
				</h1>
				<LoadingSpinner />
			</section>
		);
	}

	return (
		<section aria-labelledby="week-view-heading">
			<h1 id="week-view-heading" className={css({ srOnly: true })}>
				今週の予定
			</h1>

			{/* ヘッダー：同期状態と更新ボタン */}
			<WeekViewHeader
				lastSync={lastSync}
				onRefresh={onRefresh}
				isLoading={isLoading}
			/>

			{/* 日別イベントリスト */}
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "2",
				})}
			>
				{weekDates.map((date) => {
					const dateKey = formatDateKey(date);
					const dayEvents = groupedEvents[dateKey] || [];

					return (
						<DayGroup
							key={dateKey}
							date={date}
							events={dayEvents}
							isToday={isToday(date)}
						/>
					);
				})}
			</div>
		</section>
	);
}
