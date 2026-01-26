"use client";

/**
 * TodayViewコンポーネント
 *
 * 今日の予定一覧を表示するコンポーネントです。
 * ローディング状態、エラー状態、更新機能をサポートしています。
 *
 * @module components/calendar/TodayView
 *
 * @example
 * ```tsx
 * <TodayView
 *   events={todayEvents}
 *   isLoading={false}
 *   error={null}
 *   onRefresh={handleRefresh}
 *   lastSync={new Date()}
 * />
 * ```
 */

import { css } from "@/styled-system/css";
import { type CalendarEvent, EventList } from "./EventList";

// ============================================================
// 型定義
// ============================================================

/**
 * TodayViewコンポーネントのProps
 */
export interface TodayViewProps {
	/** 今日の予定一覧 */
	events: CalendarEvent[];
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー情報 */
	error: Error | null;
	/** 更新ボタンのコールバック */
	onRefresh: () => void;
	/** 最終同期時刻 */
	lastSync: Date | null;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * ローディングスピナー
 *
 * シンプルなCSSアニメーションによる回転スピナーです。
 *
 * @returns スピナー要素
 */
function LoadingSpinner() {
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				py: "12",
			})}
			aria-live="polite"
			aria-busy="true"
		>
			<output
				className={css({
					display: "block",
					width: "8",
					height: "8",
					border: "3px solid",
					borderColor: "border.default",
					borderTopColor: "accent.default",
					borderRadius: "full",
					animation: "spin 0.8s linear infinite",
				})}
				aria-label="読み込み中"
			/>
			<span className={css({ srOnly: true })}>予定を読み込み中...</span>
		</div>
	);
}

/**
 * エラー表示コンポーネント
 *
 * エラーメッセージとリトライボタンを表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.error - エラー情報
 * @param props.onRetry - リトライボタンのコールバック
 * @returns エラー表示要素
 */
function ErrorDisplay({
	error,
	onRetry,
}: {
	error: Error;
	onRetry: () => void;
}) {
	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "4",
				py: "8",
				px: "4",
			})}
			role="alert"
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "2",
					color: "red.600",
				})}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className={css({
						width: "5",
						height: "5",
						flexShrink: 0,
					})}
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
						clipRule="evenodd"
					/>
				</svg>
				<span
					className={css({
						fontSize: "sm",
						fontWeight: "medium",
					})}
				>
					予定の取得に失敗しました
				</span>
			</div>
			<p
				className={css({
					fontSize: "xs",
					color: "fg.muted",
					textAlign: "center",
					maxWidth: "sm",
				})}
			>
				{error.message}
			</p>
			<button
				type="button"
				onClick={onRetry}
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "2",
					px: "4",
					py: "2",
					fontSize: "sm",
					fontWeight: "medium",
					color: "fg.default",
					bg: "bg.default",
					border: "1px solid",
					borderColor: "border.default",
					borderRadius: "md",
					cursor: "pointer",
					transition: "all 0.2s",
					_hover: {
						bg: "bg.subtle",
						borderColor: "border.subtle",
					},
					_focusVisible: {
						outline: "2px solid",
						outlineColor: "accent.default",
						outlineOffset: "2px",
					},
				})}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					className={css({
						width: "4",
						height: "4",
					})}
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.22z"
						clipRule="evenodd"
					/>
				</svg>
				再試行
			</button>
		</div>
	);
}

/**
 * 更新ボタンコンポーネント
 *
 * 最終同期時刻と更新ボタンを表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.lastSync - 最終同期時刻
 * @param props.isLoading - ローディング状態
 * @param props.onRefresh - 更新ボタンのコールバック
 * @returns 更新ボタン要素
 */
function RefreshButton({
	lastSync,
	isLoading,
	onRefresh,
}: {
	lastSync: Date | null;
	isLoading: boolean;
	onRefresh: () => void;
}) {
	/**
	 * 最終同期時刻を日本語フォーマットで取得
	 */
	const formatLastSync = (date: Date): string => {
		return date.toLocaleTimeString("ja-JP", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				gap: "2",
			})}
		>
			{lastSync && (
				<span
					className={css({
						fontSize: "xs",
						color: "fg.muted",
					})}
					title={lastSync.toLocaleString("ja-JP")}
				>
					最終同期: {formatLastSync(lastSync)}
				</span>
			)}
			<button
				type="button"
				onClick={onRefresh}
				disabled={isLoading}
				aria-label="予定を更新"
				className={css({
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: "8",
					height: "8",
					borderRadius: "md",
					border: "1px solid",
					borderColor: "border.default",
					bg: "bg.default",
					color: "fg.muted",
					cursor: "pointer",
					transition: "all 0.2s",
					_hover: {
						bg: "bg.subtle",
						color: "fg.default",
					},
					_disabled: {
						opacity: 0.5,
						cursor: "not-allowed",
					},
					_focusVisible: {
						outline: "2px solid",
						outlineColor: "accent.default",
						outlineOffset: "2px",
					},
				})}
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
						d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.22z"
						clipRule="evenodd"
					/>
				</svg>
			</button>
		</div>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * 今日の予定表示コンポーネント
 *
 * 今日の予定一覧を表示し、ローディング/エラー状態を適切に処理します。
 * 右上に更新ボタンと最終同期時刻を表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.events - 今日の予定一覧
 * @param props.isLoading - ローディング状態
 * @param props.error - エラー情報
 * @param props.onRefresh - 更新ボタンのコールバック
 * @param props.lastSync - 最終同期時刻
 * @returns 今日の予定表示要素
 */
export function TodayView({
	events,
	isLoading,
	error,
	onRefresh,
	lastSync,
}: TodayViewProps) {
	return (
		<section
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "4",
				width: "100%",
			})}
			aria-labelledby="today-view-title"
		>
			{/* ヘッダー: タイトルと更新ボタン */}
			<header
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "4",
				})}
			>
				<h2
					id="today-view-title"
					className={css({
						fontSize: "lg",
						fontWeight: "semibold",
						color: "fg.default",
						m: "0",
					})}
				>
					今日の予定
				</h2>
				<RefreshButton
					lastSync={lastSync}
					isLoading={isLoading}
					onRefresh={onRefresh}
				/>
			</header>

			{/* コンテンツ: ローディング/エラー/イベント一覧 */}
			<div
				className={css({
					minHeight: "32",
				})}
			>
				{isLoading ? (
					<LoadingSpinner />
				) : error ? (
					<ErrorDisplay error={error} onRetry={onRefresh} />
				) : (
					<EventList events={events} emptyMessage="今日の予定はありません" />
				)}
			</div>
		</section>
	);
}
