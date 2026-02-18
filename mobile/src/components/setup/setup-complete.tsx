/**
 * SetupCompleteコンポーネント
 *
 * セットアップウィザードの完了画面を表示するコンポーネントです。
 * 選択したプロバイダの情報を表示し、自動またはボタンクリックで
 * メイン画面へ遷移します。
 *
 * @module components/setup/setup-complete
 */

import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { type LLMProvider, PROVIDER_INFO } from "./types";

// ============================================================
// 型定義
// ============================================================

/**
 * SetupCompleteコンポーネントのProps
 */
interface SetupCompleteProps {
	/** 選択されたプロバイダ（スキップ時はnull） */
	provider: LLMProvider | null;
	/** 開始ボタン押下時のコールバック */
	onStart: () => void;
	/** カレンダー設定画面への遷移コールバック */
	onNavigateToCalendarSettings?: () => void;
	/** 自動リダイレクト秒数（デフォルト5秒） */
	autoRedirectSeconds?: number;
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * セットアップ完了画面
 *
 * セットアップウィザードの最終ステップを表示します。
 * カウントダウンタイマーにより自動でメイン画面へ遷移するか、
 * ボタンクリックで即座に遷移できます。
 */
export function SetupComplete({
	provider,
	onStart,
	onNavigateToCalendarSettings,
	autoRedirectSeconds = 5,
}: SetupCompleteProps) {
	const [countdown, setCountdown] = useState(autoRedirectSeconds);
	const info = provider ? PROVIDER_INFO[provider] : null;

	useEffect(() => {
		if (countdown <= 0) {
			onStart();
			return;
		}

		const timer = setTimeout(() => {
			setCountdown(countdown - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [countdown, onStart]);

	return (
		<View className="items-center gap-6 py-8">
			{/* ミーアキャットイラスト */}
			<Image
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				source={require("../../../assets/images/icon.png")}
				style={{ width: 128, height: 128 }}
				accessibilityLabel="セットアップ完了"
			/>

			{/* 完了メッセージ */}
			<View className="items-center gap-2">
				<Text className="text-2xl font-bold text-fg">
					セットアップが完了しました!
				</Text>
				<Text className="text-center text-fg-muted">
					{info
						? `${info.name} を使用する準備ができました`
						: "miipaを使用する準備ができました"}
				</Text>
			</View>

			{/* 設定確認（プロバイダが選択されている場合のみ表示） */}
			{info && (
				<View className="flex-row items-center gap-3 rounded-lg bg-bg-muted p-4">
					<Text className="font-medium text-fg">{info.name}</Text>
				</View>
			)}

			{/* ボタングループ */}
			<View className="items-center gap-3">
				{/* 開始ボタン */}
				<Pressable
					onPress={onStart}
					className="rounded-lg bg-accent px-8 py-3 active:opacity-80"
				>
					<Text className="text-lg font-semibold text-white">
						miipaを始める
					</Text>
				</Pressable>

				{/* カレンダー設定ボタン */}
				{onNavigateToCalendarSettings && (
					<Pressable
						onPress={onNavigateToCalendarSettings}
						className="rounded-lg border border-border px-6 py-2"
					>
						<Text className="text-sm font-medium text-fg-muted">
							カレンダーを設定
						</Text>
					</Pressable>
				)}
			</View>

			{/* カウントダウン */}
			<Text className="text-sm text-fg-muted">
				{countdown}秒後に自動的に移動します...
			</Text>
		</View>
	);
}
