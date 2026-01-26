"use client";

/**
 * ProviderSelectorコンポーネント
 *
 * 3つのLLMプロバイダ（Claude、OpenAI、Ollama）を選択するUIコンポーネントです。
 * レスポンシブグリッドレイアウトで表示され、radiogroupロールによるアクセシビリティに対応しています。
 *
 * @module components/setup/ProviderSelector
 *
 * @example
 * ```tsx
 * <ProviderSelector
 *   selectedProvider="claude"
 *   onSelect={(provider) => setProvider(provider)}
 * />
 * ```
 */

import type { LLMProvider } from "@/lib/config/types";
import { css } from "@/styled-system/css";
import { ProviderCard } from "./ProviderCard";

/** 表示するプロバイダの順序 */
const PROVIDERS: LLMProvider[] = ["claude", "openai", "ollama"];

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

/**
 * プロバイダセレクタ
 *
 * 3つのプロバイダカードをグリッドレイアウトで表示します。
 * モバイルでは縦1列、デスクトップでは横3列で表示されます。
 *
 * @param props - コンポーネントのProps
 * @param props.selectedProvider - 選択中のプロバイダ
 * @param props.currentProvider - 現在設定されているプロバイダ（設定変更モード時）
 * @param props.onSelect - 選択時のコールバック
 * @param props.disabled - 無効化フラグ
 * @returns プロバイダセレクタ要素
 */
export function ProviderSelector({
	selectedProvider,
	currentProvider: _currentProvider,
	onSelect,
	disabled,
}: ProviderSelectorProps) {
	return (
		<div
			className={css({
				display: "grid",
				gridTemplateColumns: { base: "1fr", md: "repeat(3, 1fr)" },
				gap: "4",
			})}
			role="radiogroup"
			aria-label="AIプロバイダを選択"
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
		</div>
	);
}
