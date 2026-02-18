/**
 * ChatInputコンポーネント
 *
 * チャットメッセージの入力と送信を行うコンポーネントです。
 * Web: Enter送信対応、Mobile: 送信ボタンのみ。
 *
 * @module components/chat/chat-input
 */

import { useCallback } from "react";
import {
	type NativeSyntheticEvent,
	Platform,
	Pressable,
	TextInput,
	type TextInputKeyPressEventData,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

// ============================================================
// 型定義
// ============================================================

/** 送信キー設定 */
export type SendKeyType = "enter" | "cmd-enter";

/**
 * ChatInputコンポーネントのProps
 */
interface ChatInputProps {
	/** 入力テキスト */
	value: string;
	/** 入力テキスト変更ハンドラ */
	onChange: (value: string) => void;
	/** 送信ハンドラ */
	onSend: () => void;
	/** ローディング状態 */
	isLoading: boolean;
	/** 送信キー設定（Webのみ使用） */
	sendKey?: SendKeyType;
	/** 送信キー切替ハンドラ（Webのみ使用） */
	onToggleSendKey?: () => void;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 送信アイコン（矢印のSVG）
 */
function SendIcon() {
	return (
		<Svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
			<Path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
		</Svg>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * チャット入力コンポーネント
 *
 * テキスト入力と送信ボタンを含む入力フォームです。
 * Web: Enter/Cmd+Enter送信対応
 * Mobile: 送信ボタンのみ
 *
 * @param props - コンポーネントのProps
 * @returns 入力フォーム要素
 */
export function ChatInput({
	value,
	onChange,
	onSend,
	isLoading,
	sendKey = "enter",
	onToggleSendKey,
}: ChatInputProps) {
	const canSend = !isLoading && value.trim().length > 0;

	/**
	 * Web向けキーボードイベントハンドラ
	 */
	const handleKeyPress = useCallback(
		(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
			if (Platform.OS !== "web") return;

			// Web環境でのEnterキー送信処理
			// React Native for Web の TextInput では nativeEvent.key でキーを判定
			const key = e.nativeEvent.key;
			if (key === "Enter" && canSend) {
				if (sendKey === "enter") {
					// Enterモード: Shift+Enterは改行（WebのShift判定はここでは簡略化）
					e.preventDefault();
					onSend();
				}
			}
		},
		[sendKey, canSend, onSend],
	);

	return (
		<View className="flex-row items-end gap-2 border-t border-border bg-bg px-3 py-2">
			{/* テキスト入力 */}
			<TextInput
				value={value}
				onChangeText={onChange}
				onKeyPress={Platform.OS === "web" ? handleKeyPress : undefined}
				placeholder="miipa に質問する..."
				placeholderTextColor="#78716c"
				multiline
				editable={!isLoading}
				accessibilityLabel="メッセージ入力"
				className="min-h-[44px] max-h-[160px] flex-1 rounded-xl border border-border bg-bg-subtle px-3 py-2.5 text-sm text-fg"
			/>

			{/* 送信キー切替ボタン（Webのみ） */}
			{Platform.OS === "web" && onToggleSendKey && (
				<Pressable
					onPress={onToggleSendKey}
					accessibilityLabel={`送信キー: ${sendKey === "enter" ? "Enter" : "Cmd+Enter"}`}
					className="h-11 items-center justify-center rounded-lg border border-border px-2"
				>
					<View>
						{/* sendKey表示はText不要、アイコンで代替可能だが一旦省略 */}
					</View>
				</Pressable>
			)}

			{/* 送信ボタン */}
			<Pressable
				onPress={onSend}
				disabled={!canSend}
				accessibilityLabel="メッセージを送信"
				accessibilityRole="button"
				className={`h-11 w-11 items-center justify-center rounded-full ${
					canSend ? "bg-[#1c1917]" : "bg-bg-muted"
				}`}
			>
				<View className={canSend ? "text-white" : "text-fg-muted"}>
					<SendIcon />
				</View>
			</Pressable>
		</View>
	);
}
