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

import { formatDate } from "@/lib/utils/date";
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
// サブコンポーネント
// ============================================================

/**
 * 「今日」バッジコンポーネント
 *
 * 今日の日付であることを示すバッジです。
 * 視覚的に強調表示されます。
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
				px: "2",
				py: "0.5",
				fontSize: "xs",
				fontWeight: "bold",
				color: "white",
				bg: "blue.500",
				borderRadius: "full",
				lineHeight: "none",
			})}
			aria-hidden="true"
		>
			今日
		</span>
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
	const formattedDate = formatDate(date);

	return (
		<section
			className={css({
				mb: "6",
			})}
			aria-labelledby={`day-heading-${date.toISOString()}`}
		>
			{/* 日付見出し */}
			<header
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "2",
					mb: "3",
					pb: "2",
					borderBottom: "1px solid",
					borderColor: isToday ? "blue.200" : "border.default",
				})}
			>
				<h2
					id={`day-heading-${date.toISOString()}`}
					className={css({
						fontSize: "md",
						fontWeight: "semibold",
						color: isToday ? "blue.700" : "fg.default",
						lineHeight: "tight",
					})}
				>
					{formattedDate}
				</h2>
				{isToday && <TodayBadge />}
			</header>

			{/* イベントリスト */}
			<EventList events={events} emptyMessage="この日の予定はありません" />
		</section>
	);
}
