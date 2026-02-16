"use client";

/**
 * AI設定クライアントコンポーネント
 *
 * AI設定の表示・変更を行うクライアントコンポーネントです。
 * 現在の設定表示、プロバイダ変更、APIキー/Ollama接続設定、モデル名変更に対応しています。
 *
 * @module components/settings/AiSettingsClient
 */

import { useCallback, useEffect, useState } from "react";
import { ApiKeyForm } from "@/components/setup/ApiKeyForm";
import { OllamaConnector } from "@/components/setup/OllamaConnector";
import { ProviderSelector } from "@/components/setup/ProviderSelector";
import { PROVIDER_INFO } from "@/components/setup/types";
import type { LLMProvider } from "@/lib/config/types";
import { css } from "@/styled-system/css";

/** AI設定の型定義 */
interface AiSettings {
	/** 現在のプロバイダ */
	provider: LLMProvider | null;
	/** APIキーが設定済みかどうか */
	hasApiKey: boolean;
	/** カスタムモデル名 */
	model?: string;
	/** OllamaのベースURL */
	baseUrl?: string;
}

/** 結果メッセージの型定義 */
interface ResultMessage {
	/** メッセージの種類 */
	type: "success" | "error";
	/** メッセージ本文 */
	text: string;
}

/**
 * AI設定クライアントコンポーネント
 *
 * 現在のAI設定の表示と変更を行います。
 * プロバイダ選択、APIキー入力/Ollama接続、モデル名変更に対応しています。
 *
 * @returns AI設定画面要素
 */
export function AiSettingsClient() {
	/** 現在の設定（ローディング中はnull） */
	const [settings, setSettings] = useState<AiSettings | null>(null);
	/** 選択中のプロバイダ */
	const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(
		null,
	);
	/** 入力されたAPIキー */
	const [apiKey, setApiKey] = useState("");
	/** APIキーが検証済みか */
	const [apiKeyValidated, setApiKeyValidated] = useState(false);
	/** Ollama接続成功フラグ */
	const [ollamaConnected, setOllamaConnected] = useState(false);
	/** OllamaのURL */
	const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
	/** カスタムモデル名 */
	const [model, setModel] = useState("");
	/** 保存中フラグ */
	const [isSaving, setIsSaving] = useState(false);
	/** 結果メッセージ */
	const [message, setMessage] = useState<ResultMessage | null>(null);

	/**
	 * AI設定を取得する
	 */
	const fetchSettings = useCallback(async () => {
		try {
			const response = await fetch("/api/settings/ai");
			if (response.ok) {
				const data: AiSettings = await response.json();
				setSettings(data);
				setSelectedProvider(data.provider);
				setModel(data.model ?? "");
				if (data.baseUrl) {
					setOllamaUrl(data.baseUrl);
				}
			}
		} catch {
			setMessage({ type: "error", text: "設定の取得に失敗しました" });
		}
	}, []);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	/**
	 * プロバイダ選択時のハンドラ
	 *
	 * プロバイダ変更時にAPIキーとバリデーション状態をリセットします。
	 */
	const handleProviderSelect = useCallback((provider: LLMProvider) => {
		setSelectedProvider(provider);
		setApiKey("");
		setApiKeyValidated(false);
		setOllamaConnected(false);
		setMessage(null);
	}, []);

	/**
	 * 保存ボタンが有効かどうかを判定する
	 */
	const isSaveEnabled = (): boolean => {
		if (!selectedProvider) return false;
		if (isSaving) return false;

		// プロバイダが現在と同じ場合は保存可能（モデル名変更のため）
		if (selectedProvider === settings?.provider) return true;

		// Ollamaの場合: 接続成功が必要
		if (selectedProvider === "ollama") return ollamaConnected;

		// その他: APIキー検証済みが必要
		return apiKeyValidated;
	};

	/**
	 * 設定を保存する
	 */
	const handleSave = async () => {
		if (!selectedProvider) return;

		setIsSaving(true);
		setMessage(null);

		try {
			const body: Record<string, unknown> = {
				provider: selectedProvider,
			};

			// プロバイダが変更された場合のみAPIキー/URLを送信
			if (selectedProvider !== settings?.provider) {
				if (selectedProvider === "ollama") {
					body.baseUrl = ollamaUrl;
				} else if (apiKey) {
					body.apiKey = apiKey;
				}
			}

			// モデル名が入力されている場合
			if (model.trim()) {
				body.model = model.trim();
			}

			const response = await fetch("/api/settings/ai", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (response.ok) {
				setMessage({ type: "success", text: "設定を保存しました" });
				// 設定を再取得
				await fetchSettings();
				// フォーム状態をリセット
				setApiKey("");
				setApiKeyValidated(false);
				setOllamaConnected(false);
			} else {
				const errorBody = (await response.json().catch(() => null)) as {
					error?: { message?: string };
				} | null;
				setMessage({
					type: "error",
					text: errorBody?.error?.message ?? "設定の保存に失敗しました",
				});
			}
		} catch {
			setMessage({ type: "error", text: "ネットワークエラーが発生しました" });
		} finally {
			setIsSaving(false);
		}
	};

	// ローディング中
	if (!settings) {
		return (
			<p className={css({ color: "fg.muted", textAlign: "center", py: "8" })}>
				読み込み中...
			</p>
		);
	}

	return (
		<div
			className={css({ display: "flex", flexDirection: "column", gap: "6" })}
		>
			{/* 現在の設定セクション */}
			<section
				className={css({ display: "flex", flexDirection: "column", gap: "3" })}
			>
				<h3 className={css({ fontWeight: "semibold", fontSize: "lg" })}>
					現在の設定
				</h3>
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "3",
						flexWrap: "wrap",
					})}
				>
					<span className={css({ color: "fg.muted", fontSize: "sm" })}>
						プロバイダ:
					</span>
					<span className={css({ fontWeight: "medium" })}>
						{settings.provider
							? PROVIDER_INFO[settings.provider].name
							: "未設定"}
					</span>
					{settings.provider && (
						<span
							className={css({
								px: "2",
								py: "0.5",
								borderRadius: "full",
								fontSize: "xs",
								fontWeight: "medium",
								bg: settings.hasApiKey ? "green.100" : "yellow.100",
								color: settings.hasApiKey ? "green.800" : "yellow.800",
							})}
						>
							{settings.provider === "ollama"
								? settings.hasApiKey
									? "接続済み"
									: "未接続"
								: settings.hasApiKey
									? "APIキー設定済み"
									: "APIキー未設定"}
						</span>
					)}
				</div>
				{settings.model && (
					<div
						className={css({ display: "flex", alignItems: "center", gap: "3" })}
					>
						<span className={css({ color: "fg.muted", fontSize: "sm" })}>
							モデル:
						</span>
						<span className={css({ fontWeight: "medium", fontSize: "sm" })}>
							{settings.model}
						</span>
					</div>
				)}
			</section>

			{/* 区切り線 */}
			<hr
				className={css({
					border: "none",
					borderTop: "1px solid",
					borderColor: "border.default",
				})}
			/>

			{/* 設定変更セクション */}
			<section
				className={css({ display: "flex", flexDirection: "column", gap: "4" })}
			>
				<h3 className={css({ fontWeight: "semibold", fontSize: "lg" })}>
					設定変更
				</h3>

				{/* プロバイダ選択 */}
				<ProviderSelector
					selectedProvider={selectedProvider}
					currentProvider={settings.provider ?? undefined}
					onSelect={handleProviderSelect}
					disabled={isSaving}
				/>

				{/* プロバイダに応じた設定フォーム */}
				{selectedProvider && selectedProvider !== settings.provider && (
					<div className={css({ mt: "2" })}>
						{selectedProvider === "ollama" ? (
							<OllamaConnector
								onConnected={() => setOllamaConnected(true)}
								defaultUrl={ollamaUrl}
							/>
						) : (
							<ApiKeyForm
								provider={selectedProvider}
								onValidated={setApiKeyValidated}
								onKeyChange={setApiKey}
							/>
						)}
					</div>
				)}

				{/* モデル名入力 */}
				{selectedProvider && (
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "2",
						})}
					>
						<label
							htmlFor="model-name"
							className={css({ fontWeight: "medium" })}
						>
							モデル名（任意）
						</label>
						<input
							id="model-name"
							type="text"
							value={model}
							onChange={(e) => setModel(e.target.value)}
							placeholder="例: claude-sonnet-4-5-20250929"
							disabled={isSaving}
							className={css({
								width: "full",
								p: "3",
								border: "1px solid",
								borderColor: "border.default",
								borderRadius: "md",
								_focus: {
									outline: "2px solid",
									outlineColor: "accent.default",
									outlineOffset: "2px",
								},
								_disabled: { opacity: 0.5, cursor: "not-allowed" },
							})}
						/>
						<p className={css({ color: "fg.muted", fontSize: "xs" })}>
							空欄の場合はプロバイダのデフォルトモデルを使用します
						</p>
					</div>
				)}
			</section>

			{/* 結果メッセージ */}
			{message && (
				<div
					className={css({
						p: "3",
						borderRadius: "md",
						bg: message.type === "success" ? "green.100" : "red.100",
						color: message.type === "success" ? "green.800" : "red.800",
					})}
					role="alert"
				>
					{message.text}
				</div>
			)}

			{/* 保存ボタン */}
			<button
				type="button"
				onClick={handleSave}
				disabled={!isSaveEnabled()}
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
				{isSaving ? "保存中..." : "保存する"}
			</button>
		</div>
	);
}
