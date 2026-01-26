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

import { css, cx } from "@/styled-system/css";
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
// ユーティリティ
// ============================================================

/**
 * 今日の日付を日本語でフォーマット
 */
function formatTodayDate(): string {
	const today = new Date();
	const options: Intl.DateTimeFormatOptions = {
		month: "long",
		day: "numeric",
		weekday: "long",
	};
	return today.toLocaleDateString("ja-JP", options);
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * バウンスドットローディング
 *
 * 3つのドットがバウンスするローディングアニメーションです。
 *
 * @returns ローディング要素
 */
function LoadingSpinner() {
	const dotStyle = css({
		width: "10px",
		height: "10px",
		borderRadius: "full",
		bg: "accent.default",
	});

	return (
		<output
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "4",
				py: "12",
			})}
			aria-live="polite"
			aria-busy="true"
			aria-label="予定を読み込み中"
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "2",
				})}
				aria-hidden="true"
			>
				<span
					className={cx(
						dotStyle,
						css({
							animation: "bounce 0.6s ease-in-out infinite",
						}),
					)}
					style={{ animationDelay: "0ms" }}
				/>
				<span
					className={cx(
						dotStyle,
						css({
							animation: "bounce 0.6s ease-in-out infinite",
						}),
					)}
					style={{ animationDelay: "150ms" }}
				/>
				<span
					className={cx(
						dotStyle,
						css({
							animation: "bounce 0.6s ease-in-out infinite",
						}),
					)}
					style={{ animationDelay: "300ms" }}
				/>
			</div>
			<span
				className={css({
					fontSize: "sm",
					color: "fg.subtle",
				})}
				aria-hidden="true"
			>
				予定を読み込み中...
			</span>
		</output>
	);
}

/**
 * エラー表示コンポーネント
 *
 * ミーアキャットが困っている感じの優しいエラーメッセージを表示します。
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
				bg: "bg.subtle",
				borderRadius: "xl",
				border: "1px solid",
				borderColor: "border.default",
			})}
			role="alert"
		>
			{/* ミーアキャットアイコン（困っている顔） */}
			<div
				className={css({
					fontSize: "4xl",
					lineHeight: "1",
				})}
				aria-hidden="true"
			>
				(; _ ;)
			</div>
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "1",
				})}
			>
				<span
					className={css({
						fontSize: "sm",
						fontWeight: "medium",
						color: "fg.default",
					})}
				>
					予定の取得に失敗しました
				</span>
				<p
					className={css({
						fontSize: "xs",
						color: "fg.subtle",
						textAlign: "center",
						maxWidth: "sm",
						m: "0",
					})}
				>
					{error.message || "ネットワーク接続を確認してください"}
				</p>
			</div>
			<button
				type="button"
				onClick={onRetry}
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "2",
					px: "5",
					py: "2.5",
					fontSize: "sm",
					fontWeight: "medium",
					color: "white",
					bg: "accent.default",
					border: "none",
					borderRadius: "lg",
					cursor: "pointer",
					transition: "all 0.2s",
					_hover: {
						bg: "accent.emphasized",
						transform: "translateY(-1px)",
					},
					_active: {
						transform: "translateY(0)",
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
				もう一度試す
			</button>
		</div>
	);
}

/**
 * 空状態コンポーネント
 *
 * 予定がない場合の親しみやすい表示です。
 *
 * @returns 空状態要素
 */
function EmptyState() {
	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "3",
				py: "10",
				px: "4",
				bg: "bg.subtle",
				borderRadius: "xl",
				border: "1px dashed",
				borderColor: "border.default",
			})}
		>
			{/* ミーアキャットアイコン（リラックス） */}
			<div
				className={css({
					fontSize: "4xl",
					lineHeight: "1",
				})}
				aria-hidden="true"
			>
				( ^ o ^ )
			</div>
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "1",
				})}
			>
				<span
					className={css({
						fontSize: "sm",
						fontWeight: "medium",
						color: "fg.default",
					})}
				>
					今日の予定はありません
				</span>
				<span
					className={css({
						fontSize: "xs",
						color: "fg.subtle",
					})}
				>
					ゆっくり過ごせる一日ですね
				</span>
			</div>
		</div>
	);
}

/**
 * 更新ボタンコンポーネント
 *
 * ラベル付きの更新ボタンと最終同期時刻を表示します。
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
				gap: "3",
			})}
		>
			{lastSync && (
				<span
					className={css({
						fontSize: "xs",
						color: "fg.subtle",
					})}
					title={lastSync.toLocaleString("ja-JP")}
				>
					{formatLastSync(lastSync)} 更新
				</span>
			)}
			<button
				type="button"
				onClick={onRefresh}
				disabled={isLoading}
				aria-label={isLoading ? "予定を更新中" : "予定を更新する"}
				aria-busy={isLoading}
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "1.5",
					px: "3",
					py: "1.5",
					fontSize: "xs",
					fontWeight: "medium",
					borderRadius: "md",
					border: "1px solid",
					borderColor: "border.default",
					bg: "bg.default",
					color: "fg.default",
					cursor: "pointer",
					transition: "all 0.2s",
					_hover: {
						bg: "bg.subtle",
						borderColor: "border.subtle",
					},
					_disabled: {
						opacity: 0.6,
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
						width: "3.5",
						height: "3.5",
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
				<span aria-hidden="true">{isLoading ? "更新中..." : "更新"}</span>
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
				gap: "5",
				width: "100%",
			})}
			aria-labelledby="today-view-title"
		>
			{/* ヘッダー: タイトル、日付、更新ボタン */}
			<header
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "3",
				})}
			>
				{/* タイトルと更新ボタン */}
				<div
					className={css({
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						gap: "4",
					})}
				>
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "1",
						})}
					>
						<h2
							id="today-view-title"
							className={css({
								fontSize: "xl",
								fontWeight: "bold",
								color: "fg.default",
								m: "0",
								letterSpacing: "-0.01em",
							})}
						>
							今日の予定
						</h2>
						<time
							dateTime={new Date().toISOString().split("T")[0]}
							className={css({
								fontSize: "sm",
								color: "fg.muted",
								fontWeight: "medium",
							})}
						>
							{formatTodayDate()}
						</time>
					</div>
					<RefreshButton
						lastSync={lastSync}
						isLoading={isLoading}
						onRefresh={onRefresh}
					/>
				</div>
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
				) : events.length === 0 ? (
					<EmptyState />
				) : (
					<EventList events={events} emptyMessage="今日の予定はありません" />
				)}
			</div>
		</section>
	);
}
