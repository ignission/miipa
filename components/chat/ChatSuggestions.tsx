"use client";

/**
 * ChatSuggestionsコンポーネント
 *
 * 会話が空の時に表示するクイック質問候補です。
 * タップすることで即座に質問を送信できます。
 *
 * @module components/chat/ChatSuggestions
 */

import { css } from "@/styled-system/css";

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
 * WCAG: タッチターゲット44px以上を確保しています。
 *
 * @param props - コンポーネントのProps
 * @returns 質問候補ボタン群
 */
export function ChatSuggestions({ onSelect }: ChatSuggestionsProps) {
	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "3",
				px: "4",
				py: "6",
			})}
		>
			<p
				className={css({
					fontSize: "sm",
					color: "fg.muted",
					mb: "1",
				})}
			>
				miipa に聞いてみましょう
			</p>

			<div
				className={css({
					display: "flex",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: "2",
				})}
			>
				{SUGGESTIONS.map((suggestion) => (
					<button
						key={suggestion}
						type="button"
						onClick={() => onSelect(suggestion)}
						className={css({
							// WCAG: タッチターゲット44px以上
							minHeight: "11",
							px: "4",
							py: "2.5",
							bg: "bg.default",
							color: "fg.default",
							border: "1px solid",
							borderColor: "border.default",
							borderRadius: "full",
							fontSize: "sm",
							fontWeight: "medium",
							cursor: "pointer",
							transition: "all 0.2s ease",
							whiteSpace: "nowrap",
							_hover: {
								bg: "bg.subtle",
								borderColor: "neutral.7",
							},
							_focusVisible: {
								outline: "3px solid",
								outlineColor: "neutral.9",
								outlineOffset: "2px",
							},
							_active: {
								transform: "scale(0.97)",
							},
						})}
					>
						{suggestion}
					</button>
				))}
			</div>
		</div>
	);
}
