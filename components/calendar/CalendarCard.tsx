"use client";

/**
 * CalendarCardコンポーネント
 *
 * 個別のカレンダーを表示するカードコンポーネントです。
 * 有効/無効のトグル、削除、同期状態の表示に対応しています。
 *
 * @module components/calendar/CalendarCard
 *
 * @example
 * ```tsx
 * <CalendarCard
 *   calendar={calendarConfig}
 *   onToggle={(enabled) => handleToggle(calendarConfig.id, enabled)}
 *   onDelete={() => handleDelete(calendarConfig.id)}
 * />
 * ```
 */

import { Switch } from "@/components/ui/switch";
import type { CalendarConfig } from "@/lib/config/types";
import { css } from "@/styled-system/css";
import { SyncStatusBadge } from "./SyncStatusBadge";

/**
 * CalendarCardコンポーネントのProps
 */
interface CalendarCardProps {
	/** カレンダー設定 */
	calendar: CalendarConfig;
	/** 有効/無効トグル時のコールバック */
	onToggle: (enabled: boolean) => void;
	/** 削除時のコールバック */
	onDelete: () => void;
	/** 最終同期時刻 */
	lastSyncTime?: Date;
	/** 同期エラー状態 */
	hasError?: boolean;
}

/**
 * ゴミ箱アイコン（SVG）
 */
function TrashIcon() {
	return (
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
				d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * カレンダータイプアイコン
 *
 * @param type - カレンダータイプ（google | ical）
 * @returns アイコン要素
 */
function CalendarTypeIcon({ type }: { type: "google" | "ical" }) {
	if (type === "google") {
		// Google Calendar - 青い丸
		return (
			<span
				className={css({
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					width: "8",
					height: "8",
					borderRadius: "full",
					bg: "blue.500",
					color: "white",
					fontSize: "sm",
					fontWeight: "bold",
					flexShrink: 0,
				})}
				role="img"
				aria-label="Google Calendar"
			>
				G
			</span>
		);
	}

	// iCal - カレンダーアイコン
	return (
		<span
			className={css({
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: "8",
				height: "8",
				fontSize: "lg",
				flexShrink: 0,
			})}
			role="img"
			aria-label="iCalカレンダー"
		>
			&#x1F4C5;
		</span>
	);
}

/**
 * カレンダーカード
 *
 * 各カレンダー（Google Calendar、iCal）を表示するカードです。
 * 有効/無効の切り替え、削除、同期状態の確認ができます。
 * 無効状態のカレンダーはグレーアウトして表示されます。
 *
 * @param props - コンポーネントのProps
 * @param props.calendar - カレンダー設定
 * @param props.onToggle - 有効/無効トグル時のコールバック
 * @param props.onDelete - 削除時のコールバック
 * @param props.lastSyncTime - 最終同期時刻
 * @param props.hasError - 同期エラー状態
 * @returns カレンダーカード要素
 */
export function CalendarCard({
	calendar,
	onToggle,
	onDelete,
	lastSyncTime,
	hasError,
}: CalendarCardProps) {
	return (
		<div
			className={css({
				p: "4",
				borderRadius: "lg",
				border: "1px solid",
				borderColor: "border.default",
				bg: "bg.default",
				opacity: calendar.enabled ? 1 : 0.5,
				transition: "all 0.2s",
			})}
		>
			{/* ヘッダー: アイコン + 名前 + スイッチ + 削除 */}
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "3",
					mb: "2",
				})}
			>
				{/* タイプアイコン */}
				<CalendarTypeIcon type={calendar.type} />

				{/* カレンダー情報 */}
				<div className={css({ flex: 1, minWidth: 0 })}>
					<div
						className={css({
							fontWeight: "semibold",
							fontSize: "md",
							truncate: true,
						})}
					>
						{calendar.name}
					</div>
					{calendar.type === "google" && calendar.googleAccountEmail && (
						<div
							className={css({
								fontSize: "xs",
								color: "fg.muted",
								truncate: true,
							})}
						>
							{calendar.googleAccountEmail}
						</div>
					)}
				</div>

				{/* スイッチ */}
				<Switch.Root
					checked={calendar.enabled}
					onCheckedChange={({ checked }) => onToggle(checked)}
				>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.HiddenInput />
				</Switch.Root>

				{/* 削除ボタン */}
				<button
					type="button"
					onClick={onDelete}
					className={css({
						p: "2",
						borderRadius: "md",
						color: "fg.muted",
						cursor: "pointer",
						transition: "all 0.2s",
						_hover: {
							bg: "red.50",
							color: "red.600",
						},
						_focus: {
							outline: "2px solid",
							outlineColor: "red.500",
							outlineOffset: "2px",
						},
					})}
					aria-label={`${calendar.name}を削除`}
				>
					<TrashIcon />
				</button>
			</div>

			{/* フッター: 同期ステータス */}
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-end",
				})}
			>
				<SyncStatusBadge lastSyncTime={lastSyncTime} hasError={hasError} />
			</div>
		</div>
	);
}
