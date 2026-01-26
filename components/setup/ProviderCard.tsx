"use client";

/**
 * ProviderCardコンポーネント
 *
 * 個別のLLMプロバイダを表示するカードコンポーネントです。
 * 選択状態の視覚的フィードバック、推奨バッジ、キーボードアクセシビリティに対応しています。
 *
 * @module components/setup/ProviderCard
 *
 * @example
 * ```tsx
 * <ProviderCard
 *   provider="claude"
 *   isSelected={true}
 *   onSelect={() => setProvider('claude')}
 * />
 * ```
 */

import Image from "next/image";
import type { LLMProvider } from "@/lib/config/types";
import { css } from "@/styled-system/css";
import { PROVIDER_INFO } from "./types";

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
 * 各LLMプロバイダ（Claude、OpenAI、Ollama）を表示するカードです。
 * 選択状態がボーダーと背景色で視覚的に表現され、
 * 推奨プロバイダにはバッジが表示されます。
 *
 * @param props - コンポーネントのProps
 * @param props.provider - プロバイダID
 * @param props.isSelected - 選択中かどうか
 * @param props.onSelect - 選択時のコールバック
 * @param props.disabled - 無効化フラグ
 * @returns プロバイダカード要素
 */
export function ProviderCard({
	provider,
	isSelected,
	onSelect,
	disabled,
}: ProviderCardProps) {
	const info = PROVIDER_INFO[provider];

	return (
		<button
			type="button"
			onClick={onSelect}
			disabled={disabled}
			className={css({
				// カードスタイル
				p: "4",
				borderRadius: "lg",
				border: "2px solid",
				borderColor: isSelected ? "accent.default" : "border.default",
				bg: isSelected ? "accent.subtle" : "bg.default",
				cursor: disabled ? "not-allowed" : "pointer",
				opacity: disabled ? 0.5 : 1,
				transition: "all 0.2s",
				textAlign: "left",
				width: "full",
				_hover: {
					borderColor: disabled ? undefined : "accent.default",
				},
				_focus: {
					outline: "2px solid",
					outlineColor: "accent.default",
					outlineOffset: "2px",
				},
			})}
			aria-pressed={isSelected}
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "3",
					mb: "2",
				})}
			>
				{/* アイコン */}
				<Image
					src={info.iconPath}
					alt={info.name}
					width={32}
					height={32}
					className={css({ width: "8", height: "8" })}
				/>
				{/* 名前 + 推奨バッジ */}
				<div
					className={css({ display: "flex", alignItems: "center", gap: "2" })}
				>
					<span className={css({ fontWeight: "semibold", fontSize: "lg" })}>
						{info.name}
					</span>
					{info.isRecommended && (
						<span
							className={css({
								px: "2",
								py: "0.5",
								bg: "accent.default",
								color: "accent.fg",
								borderRadius: "full",
								fontSize: "xs",
								fontWeight: "medium",
							})}
						>
							推奨
						</span>
					)}
				</div>
			</div>
			<p className={css({ color: "fg.muted", fontSize: "sm" })}>
				{info.description}
			</p>
		</button>
	);
}
