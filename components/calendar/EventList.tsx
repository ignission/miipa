"use client";

/**
 * EventListコンポーネント
 *
 * カレンダーイベントのリストを表示するコンポーネントです。
 * EventCardコンポーネントを使用して各イベントを表示します。
 * イベントが空の場合はカスタマイズ可能なメッセージを表示します。
 *
 * @module components/calendar/EventList
 *
 * @example
 * ```tsx
 * <EventList
 *   events={calendarEvents}
 *   emptyMessage="今日の予定はありません"
 * />
 * ```
 */

import { css } from "@/styled-system/css";
import { EventCard } from "./EventCard";

// ============================================================
// 型定義
// ============================================================

/**
 * カレンダーイベントの型
 *
 * EventCardが期待する形式に合わせた型定義です。
 */
export interface CalendarEvent {
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
	/** カレンダーの色（オプション） */
	color?: string;
}

/**
 * EventListコンポーネントのProps
 */
interface EventListProps {
	/** 表示するイベントの配列 */
	events: CalendarEvent[];
	/** イベントが空の場合に表示するメッセージ（デフォルト: "予定はありません"） */
	emptyMessage?: string;
}

// ============================================================
// 定数
// ============================================================

/**
 * デフォルトの空メッセージ
 */
const DEFAULT_EMPTY_MESSAGE = "予定はありません";

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 空状態メッセージコンポーネント
 *
 * イベントが0件の場合に表示されるメッセージ領域です。
 *
 * @param props - コンポーネントのProps
 * @param props.message - 表示するメッセージ
 * @returns 空状態メッセージ要素
 */
function EmptyState({ message }: { message: string }) {
	return (
		<output
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				py: "8",
				px: "4",
				color: "fg.muted",
				fontSize: "sm",
				textAlign: "center",
			})}
		>
			<p>{message}</p>
		</output>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * イベントリストコンポーネント
 *
 * カレンダーイベントのリストを縦に並べて表示します。
 * イベントが空の場合はemptyMessageを表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.events - 表示するイベントの配列
 * @param props.emptyMessage - イベントが空の場合のメッセージ（デフォルト: "予定はありません"）
 * @returns イベントリスト要素
 */
export function EventList({
	events,
	emptyMessage = DEFAULT_EMPTY_MESSAGE,
}: EventListProps) {
	// 空の場合はメッセージを表示
	if (events.length === 0) {
		return <EmptyState message={emptyMessage} />;
	}

	return (
		<ul
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "2",
				listStyle: "none",
				p: "0",
				m: "0",
			})}
			aria-label="イベント一覧"
		>
			{events.map((event) => (
				<li key={event.id}>
					<EventCard event={event} color={event.color} />
				</li>
			))}
		</ul>
	);
}
