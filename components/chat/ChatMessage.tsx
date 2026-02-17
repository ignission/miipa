"use client";

/**
 * ChatMessageコンポーネント
 *
 * 個別のチャットメッセージを表示するコンポーネントです。
 * ユーザーメッセージは右寄せ、アシスタントメッセージは左寄せで表示されます。
 *
 * @module components/chat/ChatMessage
 */

import { css } from "@/styled-system/css";

// ============================================================
// 型定義
// ============================================================

/**
 * ChatMessageコンポーネントのProps
 */
interface ChatMessageProps {
	/** メッセージの送信者ロール */
	role: "user" | "assistant";
	/** メッセージ本文 */
	content: string;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * アシスタントアイコン（ミーアキャットをモチーフにしたシンプルなSVG）
 */
function AssistantIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={css({
				width: "5",
				height: "5",
				flexShrink: 0,
			})}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z"
				clipRule="evenodd"
			/>
			<path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
		</svg>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * チャットメッセージコンポーネント
 *
 * ユーザーメッセージとアシスタントメッセージを視覚的に区別して表示します。
 * - ユーザー: 右寄せ、アクセントカラー背景
 * - アシスタント: 左寄せ、サブトル背景、アイコン付き
 *
 * @param props - コンポーネントのProps
 * @returns メッセージ表示要素
 */
export function ChatMessage({ role, content }: ChatMessageProps) {
	const isUser = role === "user";

	return (
		<div
			className={css({
				display: "flex",
				justifyContent: isUser ? "flex-end" : "flex-start",
				gap: "2",
				px: "2",
			})}
		>
			{/* アシスタントアイコン */}
			{!isUser && (
				<div
					className={css({
						display: "flex",
						alignItems: "flex-start",
						pt: "1",
						color: "fg.muted",
					})}
				>
					<AssistantIcon />
				</div>
			)}

			{/* メッセージ本文 */}
			<div
				className={css({
					maxWidth: "80%",
					px: "4",
					py: "3",
					borderRadius: "xl",
					fontSize: "sm",
					lineHeight: "relaxed",
					whiteSpace: "pre-wrap",
					wordBreak: "break-word",
					// ユーザーとアシスタントでスタイルを分岐
					bg: isUser ? "neutral.9" : "bg.subtle",
					color: isUser ? "white" : "fg.default",
					// 角丸の調整（吹き出し風）
					borderBottomRightRadius: isUser ? "sm" : "xl",
					borderBottomLeftRadius: isUser ? "xl" : "sm",
				})}
			>
				{content}
			</div>
		</div>
	);
}
