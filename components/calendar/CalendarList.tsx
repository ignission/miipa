"use client";

/**
 * CalendarListコンポーネント
 *
 * カレンダー一覧を表示するコンポーネントです。
 * グリッドレイアウトでCalendarCardを並べ、空状態のメッセージにも対応しています。
 *
 * @module components/calendar/CalendarList
 *
 * @example
 * ```tsx
 * <CalendarList
 *   calendars={calendars}
 *   onToggle={(id, enabled) => handleToggle(id, enabled)}
 *   onDelete={(id) => handleDelete(id)}
 *   onSync={() => handleSync()}
 *   isSyncing={isSyncing}
 *   lastSyncTime={lastSyncTime}
 * />
 * ```
 */

import type { CalendarConfig, CalendarId } from "@/lib/config/types";
import { css } from "@/styled-system/css";
import { CalendarCard } from "./CalendarCard";

/**
 * CalendarListコンポーネントのProps
 */
interface CalendarListProps {
	/** カレンダー設定の配列 */
	calendars: CalendarConfig[];
	/** 有効/無効トグル時のコールバック */
	onToggle: (id: CalendarId, enabled: boolean) => void;
	/** 削除時のコールバック */
	onDelete: (id: CalendarId) => void;
	/** 同期実行時のコールバック */
	onSync: () => void;
	/** 同期中フラグ */
	isSyncing: boolean;
	/** 最終同期時刻 */
	lastSyncTime?: Date;
	/** カレンダーごとのエラー状態マップ */
	errorMap?: Map<CalendarId, boolean>;
}

/**
 * 空状態メッセージ
 */
function EmptyState() {
	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				py: "12",
				px: "4",
				textAlign: "center",
				borderRadius: "lg",
				border: "2px dashed",
				borderColor: "border.default",
				bg: "bg.subtle",
			})}
		>
			<span
				className={css({
					fontSize: "4xl",
					mb: "4",
				})}
				aria-hidden="true"
			>
				&#x1F4C5;
			</span>
			<p
				className={css({
					fontSize: "md",
					fontWeight: "medium",
					color: "fg.default",
					mb: "2",
				})}
			>
				カレンダーがありません
			</p>
			<p
				className={css({
					fontSize: "sm",
					color: "fg.muted",
				})}
			>
				カレンダーを追加してください
			</p>
		</div>
	);
}

/**
 * カレンダーリスト
 *
 * 登録されているカレンダーをグリッドレイアウトで表示します。
 * カレンダーがない場合は空状態のメッセージを表示します。
 *
 * @param props - コンポーネントのProps
 * @param props.calendars - カレンダー設定の配列
 * @param props.onToggle - 有効/無効トグル時のコールバック
 * @param props.onDelete - 削除時のコールバック
 * @param props.onSync - 同期実行時のコールバック
 * @param props.isSyncing - 同期中フラグ
 * @param props.lastSyncTime - 最終同期時刻
 * @param props.errorMap - カレンダーごとのエラー状態マップ
 * @returns カレンダーリスト要素
 */
export function CalendarList({
	calendars,
	onToggle,
	onDelete,
	onSync: _onSync,
	isSyncing: _isSyncing,
	lastSyncTime,
	errorMap,
}: CalendarListProps) {
	// 空状態
	if (calendars.length === 0) {
		return <EmptyState />;
	}

	return (
		<ul
			className={css({
				display: "grid",
				gridTemplateColumns: { base: "1fr", md: "repeat(2, 1fr)" },
				gap: "4",
				listStyle: "none",
				margin: 0,
				padding: 0,
			})}
			aria-label="カレンダー一覧"
		>
			{calendars.map((calendar) => (
				<li key={String(calendar.id)}>
					<CalendarCard
						calendar={calendar}
						onToggle={(enabled) => onToggle(calendar.id, enabled)}
						onDelete={() => onDelete(calendar.id)}
						lastSyncTime={lastSyncTime}
						hasError={errorMap?.get(calendar.id)}
					/>
				</li>
			))}
		</ul>
	);
}
