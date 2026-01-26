"use client";

/**
 * SyncStatusBadgeコンポーネント
 *
 * カレンダーの同期状態を表示するバッジコンポーネントです。
 * 最終同期時刻を相対時間で表示し、エラー時には警告アイコンを表示します。
 *
 * @module components/calendar/SyncStatusBadge
 *
 * @example
 * ```tsx
 * <SyncStatusBadge lastSyncTime={new Date()} />
 * <SyncStatusBadge lastSyncTime={syncTime} hasError={true} />
 * ```
 */

import { css } from "@/styled-system/css";

/**
 * SyncStatusBadgeコンポーネントのProps
 */
interface SyncStatusBadgeProps {
	/** 最終同期時刻 */
	lastSyncTime?: Date;
	/** エラー状態 */
	hasError?: boolean;
}

/**
 * 相対時間を日本語で取得する
 *
 * @param date - 対象の日時
 * @returns 相対時間の文字列（例: "5分前", "1時間前"）
 */
function getRelativeTimeString(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) {
		return "たった今";
	}
	if (diffMinutes < 60) {
		return `${diffMinutes}分前`;
	}
	if (diffHours < 24) {
		return `${diffHours}時間前`;
	}
	if (diffDays < 7) {
		return `${diffDays}日前`;
	}
	// 1週間以上前は日付を表示
	return date.toLocaleDateString("ja-JP", {
		month: "short",
		day: "numeric",
	});
}

/**
 * 警告アイコン（SVG）
 */
function WarningIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({
				width: "3.5",
				height: "3.5",
				color: "orange.500",
				flexShrink: 0,
			})}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * 同期ステータスバッジ
 *
 * カレンダーの最終同期時刻を相対時間で表示します。
 * エラー状態の場合は警告アイコンと共に表示されます。
 *
 * @param props - コンポーネントのProps
 * @param props.lastSyncTime - 最終同期時刻
 * @param props.hasError - エラー状態
 * @returns 同期ステータスバッジ要素
 */
export function SyncStatusBadge({
	lastSyncTime,
	hasError,
}: SyncStatusBadgeProps) {
	// 同期時刻がない場合
	if (!lastSyncTime) {
		return (
			<span
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "1",
					fontSize: "xs",
					color: "fg.muted",
				})}
			>
				未同期
			</span>
		);
	}

	const relativeTime = getRelativeTimeString(lastSyncTime);

	return (
		<span
			className={css({
				display: "inline-flex",
				alignItems: "center",
				gap: "1",
				fontSize: "xs",
				color: hasError ? "orange.600" : "fg.muted",
			})}
			title={lastSyncTime.toLocaleString("ja-JP")}
		>
			{hasError && <WarningIcon />}
			<span>{hasError ? "同期エラー" : relativeTime}</span>
		</span>
	);
}
