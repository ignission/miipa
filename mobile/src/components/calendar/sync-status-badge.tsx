/**
 * SyncStatusBadgeコンポーネント
 *
 * カレンダーの同期状態を表示するバッジコンポーネントです。
 * 最終同期時刻を相対時間で表示し、エラー時には警告テキストを表示します。
 * Web版の Panda CSS 実装から NativeWind + React Native に移行しています。
 *
 * @module components/calendar/sync-status-badge
 *
 * @example
 * ```tsx
 * <SyncStatusBadge lastSyncTime={new Date()} />
 * <SyncStatusBadge lastSyncTime={syncTime} hasError={true} />
 * ```
 */

import { Text, View } from "react-native";

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
 * 同期ステータスバッジコンポーネント
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
			<View className="flex-row items-center gap-1">
				<Text className="text-xs text-fg-muted">未同期</Text>
			</View>
		);
	}

	const relativeTime = getRelativeTimeString(lastSyncTime);

	return (
		<View className="flex-row items-center gap-1">
			{hasError && <Text className="text-xs text-red-500">⚠</Text>}
			<Text className={`text-xs ${hasError ? "text-red-500" : "text-fg-muted"}`}>
				{hasError ? "同期エラー" : relativeTime}
			</Text>
		</View>
	);
}
