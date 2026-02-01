"use client";

/**
 * EventCardコンポーネント
 *
 * 単一のカレンダーイベントを表示するカードコンポーネントです。
 * 時間、タイトル、場所を表示し、カレンダー色を左端に表示します。
 * 終日イベントは「終日」と表示され、特別な背景色で強調されます。
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
import { css, cx } from "@/styled-system/css";

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
		accountEmail?: string;
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
 * カレンダーソースアイコン（SVG）- iCal用
 */
function CalendarSourceIcon() {
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
				width: "3.5",
				height: "3.5",
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
				width: "4",
				height: "4",
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
 * 基本カードスタイル
 */
const baseCardStyle = css({
	display: "flex",
	gap: "3",
	p: "4",
	borderRadius: "lg",
	bg: "bg.default",
	color: "fg.default",
	border: "1px solid",
	borderColor: "border.default",
	boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
});

/**
 * 終日イベント用のスタイル
 */
const allDayCardStyle = css({
	bg: "bg.subtle",
	borderStyle: "dashed",
});

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
			className={cx(baseCardStyle, event.isAllDay && allDayCardStyle)}
			style={
				event.isAllDay ? { backgroundColor: `${calendarColor}10` } : undefined
			}
		>
			{/* カレンダー色ライン（左端、3px幅） */}
			<div
				className={css({
					width: "3px",
					minHeight: "full",
					borderRadius: "full",
					flexShrink: 0,
					alignSelf: "stretch",
				})}
				style={{ backgroundColor: calendarColor }}
				aria-hidden="true"
			/>

			{/* イベント情報 */}
			<div className={css({ flex: 1, minWidth: 0 })}>
				{/* 時間表示（より目立つスタイル） */}
				<time
					className={css({
						display: "inline-block",
						fontSize: "sm",
						fontWeight: "bold",
						color: "fg.muted",
						mb: "1",
						letterSpacing: "tight",
					})}
					dateTime={event.isAllDay ? undefined : event.startTime}
				>
					{timeDisplay}
				</time>

				{/* タイトル（やや大きく） */}
				<h3
					className={css({
						fontSize: "md",
						fontWeight: "semibold",
						color: "fg.default",
						truncate: true,
						lineHeight: "snug",
					})}
				>
					{event.title}
				</h3>

				{/* 場所（存在する場合のみ表示、見やすく） */}
				{event.location && (
					<div
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "1.5",
							mt: "2",
							color: "fg.muted",
							fontSize: "sm",
						})}
					>
						<LocationIcon />
						<span
							className={css({
								truncate: true,
								fontWeight: "medium",
							})}
						>
							{event.location}
						</span>
					</div>
				)}

				{/* カレンダー情報（Google: メールアドレス、iCal: カレンダー名） */}
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "1.5",
						mt: "1.5",
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
		</article>
	);
}
