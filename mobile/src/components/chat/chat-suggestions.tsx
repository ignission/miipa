/**
 * ChatSuggestionsコンポーネント
 *
 * 会話が空の時に表示するクイック質問候補です。
 * タップすることで即座に質問を送信できます。
 *
 * @module components/chat/chat-suggestions
 */

import { Pressable, Text, View } from "react-native";

// ============================================================
// 型定義
// ============================================================

/**
 * ChatSuggestionsコンポーネントのProps
 */
interface ChatSuggestionsProps {
	/** 候補選択時のハンドラ */
	onSelect: (suggestion: string) => void;
}

// ============================================================
// 定数
// ============================================================

/**
 * クイック質問候補の一覧
 */
const SUGGESTIONS = [
	"今日の予定は？",
	"空いてる時間は？",
	"今週の概要を教えて",
] as const;

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * クイック質問候補コンポーネント
 *
 * 会話が空の時に表示され、よくある質問をボタン形式で提供します。
 * タッチターゲット44px以上を確保しています。
 *
 * @param props - コンポーネントのProps
 * @returns 質問候補ボタン群
 */
export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
	return (
		<View className="flex-col items-center gap-3 px-4 py-6">
			<Text className="mb-1 text-sm text-fg-muted">
				miipa に聞いてみましょう
			</Text>

			<View className="flex-row flex-wrap justify-center gap-2">
				{SUGGESTIONS.map((suggestion) => (
					<Pressable
						key={suggestion}
						onPress={() => onSelect(suggestion)}
						accessibilityRole="button"
						className="min-h-[44px] items-center justify-center rounded-full border border-border bg-bg px-4 py-2.5 active:bg-bg-subtle"
					>
						<Text className="text-sm font-medium text-fg">{suggestion}</Text>
					</Pressable>
				))}
			</View>
		</View>
	);
}
