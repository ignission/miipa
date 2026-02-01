"use client";

/**
 * TimelineEventコンポーネント
 *
 * タイムライン上に表示する個別のカレンダーイベントコンポーネントです。
 * イベントのステータス（past/current/next/future）に応じたスタイルを適用し、
 * 時間、タイトル、場所を表示します。
 *
 * @module components/calendar/TimelineEvent
 *
 * @example
 * ```tsx
 * <TimelineEvent
 *   event={{
 *     id: "1",
 *     title: "ミーティング",
 *     startTime: "2026-01-27T09:00:00+09:00",
 *     endTime: "2026-01-27T10:00:00+09:00",
 *     isAllDay: false,
 *     location: "会議室A",
 *     source: { type: "google", calendarName: "仕事" },
 *     color: "#4285f4",
 *     column: 0,
 *     totalColumns: 1,
 *     status: "current"
 *   }}
 *   dayStart="2026-01-27T00:00:00+09:00"
 *   dayEnd="2026-01-28T00:00:00+09:00"
 * />
 * ```
 */

import { formatTime } from "@/lib/utils/date";
import {
	calculateEventPosition,
	type EventStatus,
	type TimelineEvent as TimelineEventType,
} from "@/lib/utils/timeline";
import { css, cx } from "@/styled-system/css";

// ============================================================
// 型定義
// ============================================================

/**
 * TimelineEventコンポーネントのProps
 */
interface TimelineEventProps {
	/** イベントデータ */
	event: TimelineEventType;
	/** 1日の開始時刻（ISO 8601形式） */
	dayStart: string;
	/** 1日の終了時刻（ISO 8601形式） */
	dayEnd: string;
}

// ============================================================
// 定数
// ============================================================

/**
 * デフォルトのカレンダー色
 */
const DEFAULT_COLOR = "#6b7280";

/**
 * 列間のギャップ（px）
 */
const COLUMN_GAP = 2;

/**
 * ステータス別のスタイル設定（Panda CSSクラス）
 * ダークモード対応のセマンティックトークンを使用
 */
const STATUS_STYLES: Record<
	EventStatus,
	{ className: string; opacity: number }
> = {
	past: {
		className: css({
			backgroundColor: "bg.muted",
			_dark: { backgroundColor: "gray.dark.3" },
		}),
		opacity: 0.5,
	},
	current: {
		className: css({
			backgroundColor: "colorPalette.light.3",
			colorPalette: "red",
			_dark: { backgroundColor: "colorPalette.dark.3" },
		}),
		opacity: 1,
	},
	next: {
		className: css({
			backgroundColor: "colorPalette.light.3",
			colorPalette: "gray",
			_dark: { backgroundColor: "colorPalette.dark.4" },
		}),
		opacity: 1,
	},
	future: {
		className: css({
			backgroundColor: "bg.default",
		}),
		opacity: 1,
	},
};

/**
 * バッジ設定（Panda CSSクラス）
 * ダークモード対応
 */
const BADGE_CONFIG: Record<
	"current" | "next",
	{ text: string; className: string }
> = {
	current: {
		text: "NOW",
		className: css({
			backgroundColor: "red.light.9",
			color: "white",
			_dark: { backgroundColor: "red.dark.9" },
		}),
	},
	next: {
		text: "NEXT",
		className: css({
			backgroundColor: "gray.light.9",
			color: "white",
			_dark: { backgroundColor: "gray.dark.9" },
		}),
	},
};

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * カレンダーソースアイコン（SVG）- iCal用
 */
function CalendarSourceIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({
				width: "3",
				height: "3",
				flexShrink: 0,
			})}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * アカウントアイコン（SVG）
 */
function AccountIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({
				width: "3",
				height: "3",
				flexShrink: 0,
			})}
			aria-hidden="true"
		>
			<path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
			<path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
		</svg>
	);
}

/**
 * 場所アイコン（SVG）
 */
function LocationIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({
				width: "3",
				height: "3",
				flexShrink: 0,
			})}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * ステータスバッジコンポーネント
 *
 * currentまたはnextステータスの場合にバッジを表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.status - イベントのステータス
 * @returns バッジ要素、またはnull
 */
function StatusBadge({ status }: { status: EventStatus }) {
	// pastとfutureにはバッジを表示しない
	if (status !== "current" && status !== "next") {
		return null;
	}

	const config = BADGE_CONFIG[status];

	return (
		<span
			className={cx(
				css({
					position: "absolute",
					top: "1",
					right: "1",
					fontSize: "10px",
					fontWeight: "bold",
					px: "1.5",
					py: "0.5",
					borderRadius: "full",
					lineHeight: 1,
				}),
				config.className,
			)}
		>
			{config.text}
		</span>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * 基本カードスタイル
 */
const baseCardStyle = css({
	position: "absolute",
	display: "flex",
	alignItems: "stretch",
	gap: "2",
	pl: "2",
	pr: "2",
	pt: "2",
	pb: "2",
	borderRadius: "md",
	border: "1px solid",
	borderColor: "border.default",
	boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
	overflow: "hidden",
	cursor: "pointer",
	transition: "box-shadow 0.15s ease-in-out",
	_hover: {
		boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
	},
});

/**
 * タイムラインイベントコンポーネント
 *
 * タイムライン上に配置される個別のイベントを表示します。
 * ステータスに応じた背景色とバッジを適用し、
 * 時間・タイトル・場所を表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.event - イベントデータ
 * @param props.dayStart - 1日の開始時刻
 * @param props.dayEnd - 1日の終了時刻
 * @returns タイムラインイベント要素
 */
export function TimelineEvent({ event, dayStart, dayEnd }: TimelineEventProps) {
	const calendarColor = event.color ?? DEFAULT_COLOR;
	const statusStyle = STATUS_STYLES[event.status];

	// イベントの位置を計算
	const position = calculateEventPosition(
		event.startTime,
		event.endTime,
		dayStart,
		dayEnd,
	);

	// 列に基づく水平位置を計算（横いっぱいに広がるように）
	// 3つ重なっていれば各カードは33.3%ずつ
	// ギャップはカード間のみ（totalColumns - 1箇所）
	const totalGap = (event.totalColumns - 1) * COLUMN_GAP;
	const cardWidth = `calc((100% - ${totalGap}px) / ${event.totalColumns})`;
	const cardLeft = `calc((100% - ${totalGap}px) / ${event.totalColumns} * ${event.column} + ${event.column * COLUMN_GAP}px)`;

	// 時間表示を生成
	const timeDisplay = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;

	return (
		<article
			className={cx(baseCardStyle, statusStyle.className)}
			style={{
				top: `${position.top}%`,
				height: `${position.height}%`,
				minHeight: "70px",
				left: cardLeft,
				width: cardWidth,
				opacity: statusStyle.opacity,
			}}
		>
			{/* イベント情報（縦バーを内包） */}
			<div
				className={css({
					flex: 1,
					minWidth: 0,
					position: "relative",
					display: "flex",
					gap: "2",
				})}
			>
				{/* カレンダー色バー（コンテンツと同じ高さ） */}
				<div
					className={css({
						width: "3px",
						borderRadius: "full",
						flexShrink: 0,
						alignSelf: "stretch",
					})}
					style={{ backgroundColor: calendarColor }}
					aria-hidden="true"
				/>

				{/* テキストコンテンツ */}
				<div className={css({ flex: 1, minWidth: 0 })}>
					{/* ステータスバッジ */}
					<StatusBadge status={event.status} />

					{/* 時間表示 */}
					<time
						className={css({
							display: "block",
							fontSize: "xs",
							fontWeight: "medium",
							color: "fg.muted",
							lineHeight: "tight",
						})}
						dateTime={event.startTime}
					>
						{timeDisplay}
					</time>

					{/* タイトル（1行、truncate） */}
					<h3
						className={css({
							fontSize: "sm",
							fontWeight: "semibold",
							color: "fg.default",
							truncate: true,
							lineHeight: "snug",
							mt: "0.5",
							pr: "10",
						})}
					>
						{event.title}
					</h3>

					{/* 場所（存在する場合のみ、1行、truncate） */}
					{event.location && (
						<div
							className={css({
								display: "flex",
								alignItems: "center",
								gap: "1",
								mt: "1",
								color: "fg.muted",
								fontSize: "xs",
							})}
						>
							<LocationIcon />
							<span className={css({ truncate: true })}>{event.location}</span>
						</div>
					)}

					{/* カレンダー情報（Google: メールアドレス、iCal: カレンダー名） */}
					<div
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "1",
							mt: "0.5",
							color: "fg.muted",
							fontSize: "xs",
						})}
					>
						{event.source.accountEmail ? (
							<>
								<AccountIcon />
								<span className={css({ truncate: true })}>
									{event.source.accountEmail}
								</span>
							</>
						) : (
							<>
								<CalendarSourceIcon />
								<span className={css({ truncate: true })}>
									{event.source.calendarName}
								</span>
							</>
						)}
					</div>
				</div>
			</div>
		</article>
	);
}
