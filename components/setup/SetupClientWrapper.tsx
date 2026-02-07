"use client";

/**
 * セットアップクライアントラッパーコンポーネント
 *
 * セットアップフローのクライアントサイド状態管理を担当するコンポーネントです。
 * 3ステップ（カレンダー設定 → AI設定 → 完了）の遷移を管理し、
 * 設定をAPIエンドポイント経由で保存します。
 *
 * @module components/setup/SetupClientWrapper
 *
 * @example
 * ```tsx
 * // Server Componentから使用
 * <SetupClientWrapper
 *   isExistingSetup={true}
 *   currentProvider="claude"
 * />
 * ```
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	ApiKeyForm,
	CalendarSetup,
	OllamaConnector,
	ProviderSelector,
	SetupComplete,
	type SetupStep,
	SetupStepper,
} from "@/components/setup";
import type { LLMProvider } from "@/lib/config/types";
import { css } from "@/styled-system/css";

/**
 * SetupClientWrapperコンポーネントのProps
 */
interface SetupClientWrapperProps {
	/** 既存のセットアップかどうか（設定変更モード） */
	isExistingSetup?: boolean;
	/** 現在設定されているプロバイダ */
	currentProvider?: LLMProvider;
}

/**
 * セットアップクライアントラッパー
 *
 * セットアップフローの状態管理と遷移を担当します。
 * - ステップ1: カレンダー設定
 * - ステップ2: AI設定（APIキー入力またはOllama接続）
 * - ステップ3: 完了画面
 *
 * @param props - コンポーネントのProps
 * @param props.isExistingSetup - 既存のセットアップかどうか
 * @param props.currentProvider - 現在設定されているプロバイダ
 * @returns セットアップフロー要素
 */
export function SetupClientWrapper({
	isExistingSetup = false,
	currentProvider,
}: SetupClientWrapperProps) {
	const router = useRouter();

	// 現在のステップ
	const [step, setStep] = useState<SetupStep>("calendar");

	// 選択されたプロバイダ
	const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(
		currentProvider ?? null,
	);

	// APIキーの検証状態（将来の拡張用）
	const [_isValidated, setIsValidated] = useState(false);

	// APIキーの値（一時保持）
	const [apiKeyValue, setApiKeyValue] = useState("");

	// 保存中フラグ
	const [isSaving, setIsSaving] = useState(false);

	// エラーメッセージ
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	/**
	 * プロバイダ選択ハンドラ
	 *
	 * プロバイダが選択されたときに呼び出されます。
	 * 選択状態をリセットして新しいプロバイダを設定します。
	 */
	const handleProviderSelect = (provider: LLMProvider) => {
		setSelectedProvider(provider);
		setIsValidated(false);
		setApiKeyValue("");
		setErrorMessage(null);
	};

	/**
	 * 次へ進むハンドラ
	 *
	 * カレンダー設定ステップからAI設定ステップへ進みます。
	 */
	const handleNext = () => {
		if (step === "calendar") {
			setStep("ai");
		}
	};

	/**
	 * AIステップをスキップするハンドラ
	 *
	 * AI設定をスキップして完了ステップへ進みます。
	 */
	const handleSkipAi = () => {
		setStep("complete");
	};

	/**
	 * 設定を保存して完了ステップへ遷移
	 *
	 * APIエンドポイントを呼び出して設定を保存します。
	 * 成功した場合は完了ステップへ遷移します。
	 */
	const handleSaveAndComplete = async () => {
		if (!selectedProvider) return;

		setIsSaving(true);
		setErrorMessage(null);

		// リクエストボディを構築
		const body: Record<string, unknown> = {
			provider: selectedProvider,
			overwriteExisting: isExistingSetup,
		};

		// Ollama以外はAPIキーを送信
		if (selectedProvider !== "ollama") {
			body.apiKey = apiKeyValue;
		}

		try {
			const response = await fetch("/api/setup/save-settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const result = (await response.json()) as {
				success?: boolean;
				requiresConfirmation?: boolean;
				error?: { message?: string };
			};

			if (result.success) {
				setStep("complete");
			} else if (result.requiresConfirmation) {
				// 既存のキーが存在する場合、上書き確認後に再度保存
				body.overwriteExisting = true;
				const retryResponse = await fetch("/api/setup/save-settings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
				const retryResult = (await retryResponse.json()) as {
					success?: boolean;
					error?: { message?: string };
				};
				if (retryResult.success) {
					setStep("complete");
				} else {
					setErrorMessage(
						retryResult.error?.message || "設定の保存に失敗しました",
					);
				}
			} else {
				setErrorMessage(result.error?.message || "設定の保存に失敗しました");
			}
		} catch {
			setErrorMessage("ネットワークエラーが発生しました");
		} finally {
			setIsSaving(false);
		}
	};

	/**
	 * APIキー検証成功ハンドラ
	 *
	 * APIキーの検証が成功した場合に設定を保存します。
	 */
	const handleValidated = (valid: boolean) => {
		setIsValidated(valid);
		if (valid) {
			handleSaveAndComplete();
		}
	};

	/**
	 * Ollama接続成功ハンドラ
	 *
	 * Ollamaへの接続が成功した場合に設定を保存します。
	 */
	const handleOllamaConnected = () => {
		handleSaveAndComplete();
	};

	/**
	 * 開始ハンドラ
	 *
	 * セットアップ完了後にメイン画面へ遷移します。
	 */
	const handleStart = () => {
		window.location.href = "/";
	};

	/**
	 * キャンセルハンドラ
	 *
	 * 設定変更モードでキャンセルした場合にメイン画面へ戻ります。
	 */
	const _handleCancel = () => {
		router.push("/");
	};

	return (
		<div
			className={css({ display: "flex", flexDirection: "column", gap: "8" })}
		>
			{/* ステップインジケータ */}
			<SetupStepper currentStep={step} />

			{/* ステップコンテンツ */}
			{step === "calendar" && (
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "6",
					})}
				>
					<div className={css({ textAlign: "center" })}>
						<h2
							className={css({ fontSize: "2xl", fontWeight: "bold", mb: "2" })}
						>
							カレンダーを設定
						</h2>
						<p className={css({ color: "fg.muted" })}>
							SoloDayで使用するカレンダーを連携してください
						</p>
					</div>

					<CalendarSetup onComplete={handleNext} />
				</div>
			)}

			{step === "ai" && (
				<div className={css({ maxWidth: "md", mx: "auto", width: "full" })}>
					<div className={css({ textAlign: "center", mb: "6" })}>
						<h2
							className={css({ fontSize: "2xl", fontWeight: "bold", mb: "2" })}
						>
							AIプロバイダを設定
						</h2>
						<p className={css({ color: "fg.muted" })}>
							SoloDayで使用するAIプロバイダを選択してください
						</p>
					</div>

					{/* 上書き警告（設定変更モード時） */}
					{isExistingSetup && selectedProvider && (
						<div
							className={css({
								p: "3",
								bg: "yellow.100",
								color: "yellow.800",
								borderRadius: "md",
								fontSize: "sm",
								mb: "4",
							})}
							role="alert"
						>
							現在のAPIキーを上書きします
						</div>
					)}

					{/* プロバイダ選択 */}
					<ProviderSelector
						selectedProvider={selectedProvider}
						currentProvider={currentProvider}
						onSelect={handleProviderSelect}
					/>

					{/* APIキー入力またはOllama接続 */}
					{selectedProvider && (
						<div className={css({ mt: "6" })}>
							{selectedProvider === "ollama" ? (
								<OllamaConnector onConnected={handleOllamaConnected} />
							) : (
								<ApiKeyForm
									provider={selectedProvider}
									onValidated={handleValidated}
									onKeyChange={setApiKeyValue}
								/>
							)}
						</div>
					)}

					{/* エラーメッセージ */}
					{errorMessage && (
						<div
							className={css({
								mt: "4",
								p: "3",
								borderRadius: "md",
								bg: "red.100",
								color: "red.800",
							})}
							role="alert"
						>
							{errorMessage}
						</div>
					)}

					{/* 保存中インジケータ */}
					{isSaving && (
						<div
							className={css({
								mt: "4",
								textAlign: "center",
								color: "fg.muted",
							})}
						>
							設定を保存しています...
						</div>
					)}

					{/* スキップボタン */}
					<div
						className={css({
							mt: "6",
							textAlign: "center",
						})}
					>
						<button
							type="button"
							onClick={handleSkipAi}
							className={css({
								px: "6",
								py: "2",
								color: "fg.muted",
								borderRadius: "lg",
								border: "none",
								bg: "transparent",
								cursor: "pointer",
								fontSize: "sm",
								_hover: { bg: "bg.muted" },
							})}
						>
							スキップして完了
						</button>
					</div>
				</div>
			)}

			{step === "complete" && (
				<SetupComplete provider={selectedProvider} onStart={handleStart} />
			)}
		</div>
	);
}
