/**
 * Googleカレンダー追加ボタンコンポーネント
 *
 * Google OAuth認証フローを開始するボタンを提供します。
 *
 * @module components/settings/add-google-calendar-button
 */

import { Pressable, Text } from "react-native";

// ============================================================
// 型定義
// ============================================================

/**
 * AddGoogleCalendarButtonコンポーネントのProps
 */
interface AddGoogleCalendarButtonProps {
	/** 認証を開始する関数 */
	startAuth: () => Promise<void>;
	/** 認証中フラグ */
	isLoading: boolean;
	/** 認証開始成功時のコールバック */
	onSuccess?: () => void;
	/** エラー発生時のコールバック */
	onError?: (error: string) => void;
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * Googleカレンダー追加ボタン
 *
 * タップでGoogle認証フローを開始します。
 * - ローディング中はボタンを無効化
 * - タッチターゲット44px以上を確保
 */
export function AddGoogleCalendarButton({
	startAuth,
	isLoading,
	onSuccess,
}: AddGoogleCalendarButtonProps) {
	/**
	 * ボタンタップ時のハンドラ
	 */
	const handlePress = async () => {
		onSuccess?.();
		await startAuth();
	};

	return (
		<Pressable
			onPress={handlePress}
			disabled={isLoading}
			accessibilityRole="button"
			accessibilityState={{ busy: isLoading }}
			className={`w-full flex-row items-center justify-center gap-2 rounded-md border border-border bg-bg p-3 ${
				isLoading ? "opacity-60" : "active:bg-bg-subtle"
			}`}
		>
			<Text className="font-medium text-fg">
				{isLoading ? "認証中..." : "Googleカレンダーを追加"}
			</Text>
		</Pressable>
	);
}
