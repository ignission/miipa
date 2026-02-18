/**
 * ChatToolResultコンポーネント
 *
 * AIアシスタントのツール呼び出し結果を表示するコンポーネントです。
 * カレンダー検索などの外部ツール呼び出し結果をコンパクトに表示します。
 *
 * @module components/chat/chat-tool-result
 */

import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

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
 * ツールアイコン（炎のSVG）
 */
function ToolIcon() {
	return (
		<Svg
			width={14}
			height={14}
			viewBox="0 0 20 20"
			fill="currentColor"
			className="h-3.5 w-3.5 shrink-0 text-fg-muted"
		>
			<Path
				fillRule="evenodd"
				d="M13.5 4.938a7 7 0 1 1-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.786-.46a6.997 6.997 0 0 1 .677-2.516 12.39 12.39 0 0 0 .7-2.198c.074-.332.399-.546.727-.458a7.002 7.002 0 0 1 4.38 2.902Z"
				clipRule="evenodd"
			/>
		</Svg>
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
		<View className="flex-row justify-start px-2 pl-9">
			<View className="max-w-[80%] rounded-lg border border-border bg-bg-muted px-3 py-2">
				{/* ツール名ヘッダー */}
				<View className="mb-1 flex-row items-center gap-1.5">
					<ToolIcon />
					<Text className="text-xs font-medium text-fg-muted">
						{toolName}
					</Text>
				</View>

				{/* 結果表示 */}
				<Text className="text-xs leading-relaxed text-fg">{result}</Text>
			</View>
		</View>
	);
}
