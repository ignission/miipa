"use client";

/**
 * EventCardコンポーネント
 *
 * 単一のカレンダーイベントを表示するカードコンポーネントです。
 * 時間、タイトル、場所を表示し、カレンダー色を左端に表示します。
 * 終日イベントは「終日」と表示されます。
 *
 * @module components/calendar/EventCard
 *
 * @example
 * ```tsx
 * <EventCard
 *   event={{
 *     id: "1",
 *     title: "ミーティング",
 *     startTime: "2026-01-26T00:30:00.000Z",
 *     endTime: "2026-01-26T01:30:00.000Z",
 *     isAllDay: false,
 *     location: "会議室A",
 *     source: { type: "google", calendarName: "仕事" }
 *   }}
 *   color="#4285f4"
 * />
 * ```
 */

import { formatTime } from "@/lib/utils/date";
import { css } from "@/styled-system/css";

// ============================================================
// 型定義
// ============================================================

/**
 * イベントデータの型
 */
interface EventData {
	/** イベントID */
	id: string;
	/** イベントタイトル */
	title: string;
	/** 開始時刻（ISO 8601形式） */
	startTime: string;
	/** 終了時刻（ISO 8601形式） */
	endTime: string;
	/** 終日イベントかどうか */
	isAllDay: boolean;
	/** 場所（nullの場合は表示しない） */
	location: string | null;
	/** イベントのソース情報 */
	source: {
		type: string;
		calendarName: string;
	};
}

/**
 * EventCardコンポーネントのProps
 */
interface EventCardProps {
	/** イベントデータ */
	event: EventData;
	/** カレンダー色（指定がない場合はデフォルト色を使用） */
	color?: string;
}

// ============================================================
// 定数
// ============================================================

/**
 * デフォルトのカレンダー色
 */
const DEFAULT_COLOR = "#6b7280";

// ============================================================
// サブコンポーネント
// ============================================================

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
				width: "3.5",
				height: "3.5",
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

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * イベントカードコンポーネント
 *
 * カレンダーイベントを視覚的に表示するカードです。
 * 左端にカレンダー色のラインを表示し、時間・タイトル・場所を表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.event - イベントデータ
 * @param props.color - カレンダー色（オプション）
 * @returns イベントカード要素
 */
export function EventCard({ event, color }: EventCardProps) {
	const calendarColor = color ?? DEFAULT_COLOR;

	/**
	 * 時間表示を生成
	 *
	 * - 終日イベント: "終日"
	 * - 通常イベント: "09:30 - 10:00"
	 */
	const timeDisplay = event.isAllDay
		? "終日"
		: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;

	return (
		<article
			className={css({
				display: "flex",
				gap: "3",
				p: "3",
				borderRadius: "md",
				bg: "bg.default",
				border: "1px solid",
				borderColor: "border.default",
				transition: "all 0.15s",
				_hover: {
					bg: "bg.subtle",
				},
			})}
			aria-label={`${event.title}${event.location ? `、場所: ${event.location}` : ""}`}
		>
			{/* カレンダー色ライン（左端） */}
			<div
				className={css({
					width: "1",
					minHeight: "full",
					borderRadius: "full",
					flexShrink: 0,
				})}
				style={{ backgroundColor: calendarColor }}
				aria-hidden="true"
			/>

			{/* イベント情報 */}
			<div className={css({ flex: 1, minWidth: 0 })}>
				{/* 時間表示 */}
				<time
					className={css({
						display: "block",
						fontSize: "xs",
						fontWeight: "medium",
						color: event.isAllDay ? "fg.default" : "fg.muted",
						mb: "0.5",
					})}
					dateTime={event.isAllDay ? undefined : event.startTime}
				>
					{timeDisplay}
				</time>

				{/* タイトル */}
				<h3
					className={css({
						fontSize: "sm",
						fontWeight: "semibold",
						color: "fg.default",
						truncate: true,
						lineHeight: "tight",
					})}
				>
					{event.title}
				</h3>

				{/* 場所（存在する場合のみ表示） */}
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
			</div>
		</article>
	);
}
