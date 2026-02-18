/**
 * ProviderSelectorコンポーネント
 *
 * LLMプロバイダ（Claude、OpenAI、Gemini、Ollama）を選択するUIコンポーネントです。
 * ProviderCardを統合して1ファイルで実装しています。
 *
 * @module components/setup/provider-selector
 */

import { Pressable, Text, View } from "react-native";
import {
	type LLMProvider,
	PROVIDER_INFO,
} from "./types";

// ============================================================
// 型定義
// ============================================================

/** 表示するプロバイダの順序 */
const PROVIDERS: LLMProvider[] = ["claude", "gemini", "openai", "ollama"];

/**
 * ProviderSelectorコンポーネントのProps
 */
interface ProviderSelectorProps {
	/** 選択中のプロバイダ */
	selectedProvider: LLMProvider | null;
	/** 現在設定されているプロバイダ（設定変更モード時） */
	currentProvider?: LLMProvider;
	/** 選択時のコールバック */
	onSelect: (provider: LLMProvider) => void;
	/** 無効化 */
	disabled?: boolean;
}

// ============================================================
// サブコンポーネント: ProviderCard
// ============================================================

/**
 * ProviderCardコンポーネントのProps
 */
interface ProviderCardProps {
	/** プロバイダID */
	provider: LLMProvider;
	/** 選択中かどうか */
	isSelected: boolean;
	/** 選択時のコールバック */
	onSelect: () => void;
	/** 無効化 */
	disabled?: boolean;
}

/**
 * プロバイダカード
 *
 * 各LLMプロバイダを表示するカードです。
 * 選択状態がボーダーと背景色で視覚的に表現されます。
 */
function ProviderCard({
	provider,
	isSelected,
	onSelect,
	disabled,
}: ProviderCardProps) {
	const info = PROVIDER_INFO[provider];

	return (
		<Pressable
			onPress={onSelect}
			disabled={disabled}
			accessibilityRole="radio"
			accessibilityState={{ selected: isSelected, disabled }}
			className={`w-full rounded-lg border-2 p-4 ${
				isSelected
					? "border-accent bg-accent-50"
					: "border-border bg-bg"
			} ${disabled ? "opacity-50" : ""}`}
		>
			{/* ヘッダー: 名前 + 推奨バッジ */}
			<View className="mb-2 flex-row items-center gap-2">
				<Text className="text-lg font-semibold text-fg">
					{info.name}
				</Text>
				{info.isRecommended && (
					<View className="rounded-full bg-accent px-2 py-0.5">
						<Text className="text-xs font-medium text-white">
							推奨
						</Text>
					</View>
				)}
			</View>

			{/* 説明 */}
			<Text className="text-sm text-fg-muted">{info.description}</Text>
		</Pressable>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * プロバイダセレクタ
 *
 * プロバイダカードを縦並びで表示します。
 *
 * @param props - コンポーネントのProps
 * @returns プロバイダセレクタ要素
 */
export function ProviderSelector({
	selectedProvider,
	currentProvider: _currentProvider,
	onSelect,
	disabled,
}: ProviderSelectorProps) {
	return (
		<View
			className="gap-4"
			accessibilityRole="radiogroup"
			accessibilityLabel="AIプロバイダを選択"
		>
			{PROVIDERS.map((provider) => (
				<ProviderCard
					key={provider}
					provider={provider}
					isSelected={selectedProvider === provider}
					onSelect={() => onSelect(provider)}
					disabled={disabled}
				/>
			))}
		</View>
	);
}
