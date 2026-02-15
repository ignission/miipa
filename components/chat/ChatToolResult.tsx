"use client";

/**
 * ChatToolResultコンポーネント
 *
 * AIアシスタントのツール呼び出し結果を表示するコンポーネントです。
 * カレンダー検索などの外部ツール呼び出し結果をコンパクトに表示します。
 *
 * @module components/chat/ChatToolResult
 */

import { css } from "@/styled-system/css";

// ============================================================
// 型定義
// ============================================================

/**
 * ChatToolResultコンポーネントのProps
 */
interface ChatToolResultProps {
	/** ツール名 */
	toolName: string;
	/** ツール実行結果 */
	result: string;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * ツールアイコン（レンチのSVG）
 */
function ToolIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({
				width: "3.5",
				height: "3.5",
				flexShrink: 0,
			})}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M13.5 4.938a7 7 0 1 1-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.786-.46a6.997 6.997 0 0 1 .677-2.516 12.39 12.39 0 0 0 .7-2.198c.074-.332.399-.546.727-.458a7.002 7.002 0 0 1 4.38 2.902Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * ツール呼び出し結果表示コンポーネント
 *
 * ツール名と実行結果をコンパクトなカード形式で表示します。
 *
 * @param props - コンポーネントのProps
 * @returns ツール結果表示要素
 */
export function ChatToolResult({ toolName, result }: ChatToolResultProps) {
	return (
		<div
			className={css({
				display: "flex",
				justifyContent: "flex-start",
				px: "2",
				pl: "9",
			})}
		>
			<div
				className={css({
					maxWidth: "80%",
					px: "3",
					py: "2",
					borderRadius: "lg",
					bg: "bg.muted",
					border: "1px solid",
					borderColor: "border.default",
					fontSize: "xs",
				})}
			>
				{/* ツール名ヘッダー */}
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "1.5",
						color: "fg.muted",
						mb: "1",
					})}
				>
					<ToolIcon />
					<span className={css({ fontWeight: "medium" })}>{toolName}</span>
				</div>

				{/* 結果表示 */}
				<div
					className={css({
						color: "fg.default",
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
						lineHeight: "relaxed",
					})}
				>
					{result}
				</div>
			</div>
		</div>
	);
}
