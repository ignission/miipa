"use client";

/**
 * APIキー入力フォームコンポーネント
 *
 * 選択されたLLMプロバイダのAPIキーを入力・検証するためのフォームを提供します。
 * 入力されたAPIキーはstateに一時保持され、検証APIを呼び出して有効性を確認します。
 *
 * @module components/setup/ApiKeyForm
 */

import Image from "next/image";
import { useState } from "react";
import type { LLMProvider } from "@/lib/config/types";
import { css } from "@/styled-system/css";
import { PROVIDER_INFO } from "./types";

/**
 * ApiKeyFormコンポーネントのProps
 */
interface ApiKeyFormProps {
	/** プロバイダ */
	provider: LLMProvider;
	/** 検証成功時のコールバック */
	onValidated: (isValid: boolean) => void;
	/** キー変更時のコールバック */
	onKeyChange: (key: string) => void;
}

/**
 * APIキー検証結果の型
 */
interface ValidationResult {
	valid: boolean;
	error?: { code: string; message: string };
}

/**
 * APIキー入力フォーム
 *
 * LLMプロバイダのAPIキーを入力し、検証するためのフォームコンポーネントです。
 * - APIキーの入力（パスワードマスク付き）
 * - 表示/非表示の切り替え
 * - APIキーの検証（Enter押下または検証ボタン）
 * - 検証結果の表示
 * - ヘルプリンク
 *
 * @param props - コンポーネントのProps
 * @returns APIキー入力フォーム
 */
export function ApiKeyForm({
	provider,
	onValidated,
	onKeyChange,
}: ApiKeyFormProps) {
	// APIキーのstate（ログ出力禁止、一時保持のみ）
	const [apiKey, setApiKey] = useState("");
	// 表示/非表示フラグ
	const [showKey, setShowKey] = useState(false);
	// 検証中フラグ
	const [isValidating, setIsValidating] = useState(false);
	// 検証結果
	const [validationResult, setValidationResult] =
		useState<ValidationResult | null>(null);

	// プロバイダ情報を取得
	const info = PROVIDER_INFO[provider];

	/**
	 * APIキーの検証を実行
	 *
	 * 入力されたAPIキーをサーバーサイドAPIで検証し、結果を表示します。
	 */
	const handleValidate = async () => {
		// 空の場合は検証しない
		if (!apiKey.trim()) return;

		setIsValidating(true);
		setValidationResult(null);

		try {
			const response = await fetch("/api/setup/validate-key", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider, apiKey }),
			});

			const result: ValidationResult = await response.json();
			setValidationResult(result);
			onValidated(result.valid);
		} catch {
			// ネットワークエラーの場合
			setValidationResult({
				valid: false,
				error: {
					code: "NETWORK_ERROR",
					message: "ネットワークエラーが発生しました",
				},
			});
			onValidated(false);
		} finally {
			setIsValidating(false);
		}
	};

	/**
	 * キーボードイベントハンドラ
	 *
	 * Enterキー押下時に検証を実行します。
	 */
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && apiKey.trim()) {
			handleValidate();
		}
	};

	return (
		<div
			className={css({ display: "flex", flexDirection: "column", gap: "4" })}
		>
			{/* プロバイダ情報 */}
			<div className={css({ display: "flex", alignItems: "center", gap: "3" })}>
				<Image
					src={info.iconPath}
					alt={info.name}
					width={32}
					height={32}
					className={css({ width: "8", height: "8" })}
				/>
				<span className={css({ fontWeight: "semibold", fontSize: "lg" })}>
					{info.name}
				</span>
			</div>

			{/* APIキー入力 */}
			<div
				className={css({ display: "flex", flexDirection: "column", gap: "2" })}
			>
				<label htmlFor="api-key" className={css({ fontWeight: "medium" })}>
					APIキー
				</label>
				<div className={css({ display: "flex", gap: "2" })}>
					<div className={css({ position: "relative", flex: "1" })}>
						<input
							id="api-key"
							type={showKey ? "text" : "password"}
							value={apiKey}
							onChange={(e) => {
								setApiKey(e.target.value);
								onKeyChange(e.target.value);
								setValidationResult(null);
							}}
							onKeyDown={handleKeyDown}
							placeholder={`${info.name}のAPIキーを入力`}
							className={css({
								width: "full",
								p: "3",
								pr: "10",
								border: "1px solid",
								borderColor: "border.default",
								borderRadius: "md",
								_focus: {
									outline: "2px solid",
									outlineColor: "accent.default",
									outlineOffset: "2px",
								},
							})}
						/>
						<button
							type="button"
							onClick={() => setShowKey(!showKey)}
							className={css({
								position: "absolute",
								right: "3",
								top: "50%",
								transform: "translateY(-50%)",
								color: "fg.muted",
								cursor: "pointer",
								background: "transparent",
								border: "none",
								padding: "0",
							})}
							aria-label={showKey ? "APIキーを隠す" : "APIキーを表示"}
						>
							{showKey ? "🙈" : "👁"}
						</button>
					</div>
				</div>
			</div>

			{/* ヘルプリンク */}
			{info.apiKeyHelpUrl && (
				<a
					href={info.apiKeyHelpUrl}
					target="_blank"
					rel="noopener noreferrer"
					className={css({
						color: "accent.default",
						fontSize: "sm",
						textDecoration: "underline",
						_hover: { textDecoration: "none" },
					})}
				>
					APIキーの取得方法 ↗
				</a>
			)}

			{/* 検証ボタン */}
			<button
				type="button"
				onClick={handleValidate}
				disabled={!apiKey.trim() || isValidating}
				className={css({
					p: "3",
					bg: "accent.default",
					color: "accent.fg",
					borderRadius: "md",
					fontWeight: "medium",
					cursor: "pointer",
					border: "none",
					_disabled: { opacity: 0.5, cursor: "not-allowed" },
					_hover: { bg: "accent.emphasized" },
				})}
			>
				{isValidating ? "検証中..." : "検証する"}
			</button>

			{/* 検証結果 */}
			{validationResult && (
				<div
					className={css({
						p: "3",
						borderRadius: "md",
						bg: validationResult.valid ? "green.100" : "red.100",
						color: validationResult.valid ? "green.800" : "red.800",
					})}
					role="alert"
				>
					{validationResult.valid
						? "APIキーの検証に成功しました"
						: validationResult.error?.message || "APIキーの検証に失敗しました"}
				</div>
			)}
		</div>
	);
}
