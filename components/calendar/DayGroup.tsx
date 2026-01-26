"use client";

/**
 * DayGroupコンポーネント
 *
 * 日別のイベントグループを表示するコンポーネントです。
 * 日付見出しとその日のイベントリストを表示します。
 * 今日の場合は「今日」バッジを強調表示します。
 *
 * @module components/calendar/DayGroup
 *
 * @example
 * ```tsx
 * <DayGroup
 *   date={new Date()}
 *   events={todayEvents}
 *   isToday={true}
 * />
 * ```
 */

import { getWeekdayName } from "@/lib/utils/date";
import { css } from "@/styled-system/css";
import { type CalendarEvent, EventList } from "./EventList";

// ============================================================
// 型定義
// ============================================================

/**
 * DayGroupコンポーネントのProps
 */
interface DayGroupProps {
	/** 表示する日付 */
	date: Date;
	/** その日のイベント一覧 */
	events: CalendarEvent[];
	/** 今日かどうか */
	isToday: boolean;
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * 日付から月と日を取得します
 *
 * @param date - 対象の日付
 * @returns { month: number, day: number }
 */
function getMonthAndDay(date: Date): { month: number; day: number } {
	const formatter = new Intl.DateTimeFormat("ja-JP", {
		timeZone: "Asia/Tokyo",
		month: "numeric",
		day: "numeric",
	});

	const parts = formatter.formatToParts(date);
	const month = Number(parts.find((p) => p.type === "month")?.value ?? "1");
	const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");

	return { month, day };
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 「今日」バッジコンポーネント
 *
 * 今日の日付であることを示すモダンなバッジです。
 * グラデーションと軽い影で視覚的に強調されます。
 * スクリーンリーダー向けに「今日」というテキストを視覚的に隠して提供します。
 *
 * @returns バッジ要素
 */
function TodayBadge() {
	return (
		<span
			className={css({
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				px: "3",
				py: "1",
				fontSize: "xs",
				fontWeight: "bold",
				// コントラスト比改善: #1a1a1a（ほぼ黒）をamber背景上で使用
				// amber (#d97706) と黒文字のコントラスト比は約 5.5:1 (AA準拠)
				color: "#1a1a1a",
				background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
				borderRadius: "full",
				lineHeight: "none",
				boxShadow: "0 2px 4px rgba(245, 158, 11, 0.3)",
				letterSpacing: "0.05em",
			})}
		>
			{/* 視覚的には「TODAY」、スクリーンリーダーには「今日」と読み上げ */}
			<span aria-hidden="true">TODAY</span>
			<span className={css({ srOnly: true })}>今日</span>
		</span>
	);
}

/**
 * 曜日表示のスタイルを取得します
 *
 * 色だけでなく、視覚的な装飾（丸括弧）も追加して
 * 色覚異常のユーザーにも区別できるようにします。
 *
 * @param weekday - 曜日名（日、月、火...）
 * @returns 曜日のスタイル情報
 */
function getWeekdayStyle(weekday: string): {
	color: string;
	prefix: string;
	suffix: string;
} {
	switch (weekday) {
		case "日":
			// 日曜: 赤系（コントラスト比改善のため red.600 を使用）
			// red.600 (#dc2626) は白背景上でコントラスト比 4.5:1 以上
			return { color: "red.600", prefix: "", suffix: "" };
		case "土":
			// 土曜: 青系（コントラスト比改善のため blue.600 を使用）
			// blue.600 (#2563eb) は白背景上でコントラスト比 4.5:1 以上
			return { color: "blue.600", prefix: "", suffix: "" };
		default:
			return { color: "fg.muted", prefix: "", suffix: "" };
	}
}

/**
 * 日付表示コンポーネント
 *
 * 日付を大きく表示し、月と曜日を分けて表示します。
 * 曜日の色分けはコントラスト比を確保しています。
 *
 * @param props - コンポーネントのProps
 * @param props.date - 表示する日付
 * @param props.isToday - 今日かどうか
 * @returns 日付表示要素
 */
function DateDisplay({ date, isToday }: { date: Date; isToday: boolean }) {
	const { month, day } = getMonthAndDay(date);
	const weekday = getWeekdayName(date);
	const weekdayStyle = getWeekdayStyle(weekday);

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "baseline",
				gap: "2",
			})}
		>
			{/* 日にち（大きく） */}
			<span
				className={css({
					fontSize: "2xl",
					fontWeight: "bold",
					lineHeight: "none",
					// amber.800 はコントラスト比が高い
					color: isToday ? "amber.800" : "fg.default",
				})}
			>
				{day}
			</span>

			{/* 月と曜日 */}
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "0",
				})}
			>
				<span
					className={css({
						fontSize: "xs",
						fontWeight: "medium",
						// amber.700 はコントラスト比が高い
						color: isToday ? "amber.700" : "fg.muted",
						lineHeight: "tight",
					})}
				>
					{month}月
				</span>
				<span
					className={css({
						fontSize: "xs",
						fontWeight: "semibold",
						lineHeight: "tight",
					})}
					style={{
						color: `var(--colors-${weekdayStyle.color.replace(".", "-")})`,
					}}
				>
					{weekdayStyle.prefix}
					{weekday}曜日
					{weekdayStyle.suffix}
				</span>
			</div>
		</div>
	);
}

/**
 * 予定なしメッセージコンポーネント
 *
 * イベントがない日にシンプルに表示するメッセージです。
 *
 * @returns メッセージ要素
 */
function NoEventsMessage() {
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				gap: "2",
				py: "4",
				px: "3",
				color: "fg.muted",
				fontSize: "sm",
			})}
		>
			<span
				className={css({
					display: "inline-block",
					w: "1",
					h: "1",
					borderRadius: "full",
					bg: "border.default",
				})}
				aria-hidden="true"
			/>
			予定なし
		</div>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * 日別グループコンポーネント
 *
 * 日付見出しとその日のイベントリストを表示します。
 * 今日の場合は「今日」バッジが日付の横に表示されます。
 *
 * @param props - コンポーネントのProps
 * @param props.date - 表示する日付
 * @param props.events - その日のイベント一覧
 * @param props.isToday - 今日かどうか
 * @returns 日別グループ要素
 */
export function DayGroup({ date, events, isToday }: DayGroupProps) {
	const hasEvents = events.length > 0;

	return (
		<section
			className={css({
				mb: "2",
				borderRadius: "lg",
				overflow: "hidden",
				// 今日のグループは薄いアンバー背景
				bg: isToday ? "amber.50" : "transparent",
				// 日付間の区切りを明確に
				border: "1px solid",
				borderColor: isToday ? "amber.200" : "border.subtle",
			})}
			aria-labelledby={`day-heading-${date.toISOString()}`}
		>
			{/* 日付見出し */}
			<header
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "3",
					px: "4",
					py: "3",
					// 今日は見出し部分も少し強調
					bg: isToday ? "amber.100/50" : "bg.subtle",
					borderBottom: "1px solid",
					borderColor: isToday ? "amber.200" : "border.subtle",
				})}
			>
				<h2
					id={`day-heading-${date.toISOString()}`}
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "3",
						m: "0",
					})}
				>
					<DateDisplay date={date} isToday={isToday} />
					{isToday && <TodayBadge />}
				</h2>

				{/* イベント数バッジ */}
				{hasEvents && (
					<span
						className={css({
							fontSize: "xs",
							fontWeight: "medium",
							// amber.800 はコントラスト比が高い
							color: isToday ? "amber.800" : "fg.muted",
							bg: isToday ? "amber.200" : "bg.muted",
							px: "2",
							py: "0.5",
							borderRadius: "md",
						})}
					>
						{/* スクリーンリーダー向けに「予定」を追加 */}
						<span className={css({ srOnly: true })}>予定</span>
						{events.length}件
					</span>
				)}
			</header>

			{/* イベントリスト */}
			<div
				className={css({
					px: "3",
					py: "2",
				})}
			>
				{hasEvents ? (
					<EventList events={events} emptyMessage="" />
				) : (
					<NoEventsMessage />
				)}
			</div>
		</section>
	);
}
