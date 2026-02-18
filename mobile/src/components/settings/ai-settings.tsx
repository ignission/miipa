/**
 * AI設定コンポーネント
 *
 * AI設定の表示・変更を行うコンポーネントです。
 * 現在の設定表示、プロバイダ変更、APIキー/Ollama接続設定、モデル名変更に対応しています。
 *
 * @module components/settings/ai-settings
 */

import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
	type AISettingsResponse,
	fetchAISettings,
	type UpdateAISettingsRequest,
	updateAISettings,
} from "../../api/settings";
import { ApiKeyForm } from "../setup/api-key-form";
import { OllamaConnector } from "../setup/ollama-connector";
import { ProviderSelector } from "../setup/provider-selector";
import { type LLMProvider, PROVIDER_INFO } from "../setup/types";

// ============================================================
// 型定義
// ============================================================

/** 結果メッセージの型定義 */
interface ResultMessage {
	type: "success" | "error";
	text: string;
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * プロバイダの状態ラベルを返す
 */
function getStatusLabel(provider: string | null, hasApiKey: boolean): string {
	if (provider === "ollama") {
		return hasApiKey ? "接続済み" : "未接続";
	}
	return hasApiKey ? "APIキー設定済み" : "APIキー未設定";
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * AI設定コンポーネント
 *
 * 現在のAI設定の表示と変更を行います。
 */
export function AiSettings() {
	const [settings, setSettings] = useState<AISettingsResponse | null>(null);
	const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(
		null,
	);
	const [apiKey, setApiKey] = useState("");
	const [apiKeyValidated, setApiKeyValidated] = useState(false);
	const [ollamaConnected, setOllamaConnected] = useState(false);
	const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
	const [model, setModel] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState<ResultMessage | null>(null);

	/**
	 * AI設定を取得する
	 */
	const fetchSettingsData = useCallback(async () => {
		try {
			const data = await fetchAISettings();
			setSettings(data);
			setSelectedProvider(data.provider as LLMProvider | null);
			setModel(data.model ?? "");
			if (data.baseUrl) {
				setOllamaUrl(data.baseUrl);
			}
		} catch {
			setMessage({ type: "error", text: "設定の取得に失敗しました" });
		}
	}, []);

	useEffect(() => {
		fetchSettingsData();
	}, [fetchSettingsData]);

	/**
	 * プロバイダ選択時のハンドラ
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
		if (selectedProvider === settings?.provider) return true;
		if (selectedProvider === "ollama") return ollamaConnected;
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
			const requestData: UpdateAISettingsRequest = {
				provider: selectedProvider,
			};

			// プロバイダ変更時のみ認証情報を含める
			if (selectedProvider !== settings?.provider) {
				if (selectedProvider === "ollama") {
					requestData.baseUrl = ollamaUrl;
				} else if (apiKey) {
					requestData.apiKey = apiKey;
				}
			}

			const trimmedModel = model.trim();
			if (trimmedModel) {
				requestData.model = trimmedModel;
			}

			const result = await updateAISettings(requestData);

			if (result.success) {
				setMessage({ type: "success", text: "設定を保存しました" });
				await fetchSettingsData();
				setApiKey("");
				setApiKeyValidated(false);
				setOllamaConnected(false);
			} else {
				setMessage({
					type: "error",
					text: result.error?.message ?? "設定の保存に失敗しました",
				});
			}
		} catch {
			setMessage({
				type: "error",
				text: "ネットワークエラーが発生しました",
			});
		} finally {
			setIsSaving(false);
		}
	};

	// ローディング中
	if (!settings) {
		return (
			<View className="items-center py-8">
				<Text className="text-fg-muted">読み込み中...</Text>
			</View>
		);
	}

	return (
		<View className="gap-6">
			{/* 現在の設定セクション */}
			<View className="gap-3">
				<Text className="text-lg font-semibold text-fg">現在の設定</Text>
				<View className="flex-row flex-wrap items-center gap-3">
					<Text className="text-sm text-fg-muted">プロバイダ:</Text>
					<Text className="font-medium text-fg">
						{settings.provider
							? (PROVIDER_INFO[settings.provider as LLMProvider]?.name ??
								settings.provider)
							: "未設定"}
					</Text>
					{settings.provider && (
						<View
							className={`rounded-full px-2 py-0.5 ${
								settings.hasApiKey ? "bg-green-100" : "bg-yellow-100"
							}`}
						>
							<Text
								className={`text-xs font-medium ${
									settings.hasApiKey ? "text-green-800" : "text-yellow-800"
								}`}
							>
								{getStatusLabel(settings.provider, settings.hasApiKey)}
							</Text>
						</View>
					)}
				</View>
				{settings.model && (
					<View className="flex-row items-center gap-3">
						<Text className="text-sm text-fg-muted">モデル:</Text>
						<Text className="text-sm font-medium text-fg">
							{settings.model}
						</Text>
					</View>
				)}
			</View>

			{/* 区切り線 */}
			<View className="border-t border-border" />

			{/* 設定変更セクション */}
			<View className="gap-4">
				<Text className="text-lg font-semibold text-fg">設定変更</Text>

				{/* プロバイダ選択 */}
				<ProviderSelector
					selectedProvider={selectedProvider}
					currentProvider={(settings.provider as LLMProvider) ?? undefined}
					onSelect={handleProviderSelect}
					disabled={isSaving}
				/>

				{/* プロバイダに応じた設定フォーム */}
				{selectedProvider && selectedProvider !== settings.provider && (
					<View className="mt-2">
						{selectedProvider === "ollama" ? (
							<OllamaConnector
								onConnected={(connectedUrl) => {
									setOllamaUrl(connectedUrl);
									setOllamaConnected(true);
								}}
								defaultUrl={ollamaUrl}
							/>
						) : (
							<ApiKeyForm
								provider={selectedProvider}
								onValidated={setApiKeyValidated}
								onKeyChange={setApiKey}
							/>
						)}
					</View>
				)}

				{/* モデル名入力 */}
				{selectedProvider && (
					<View className="gap-2">
						<Text className="font-medium text-fg">モデル名（任意）</Text>
						<TextInput
							value={model}
							onChangeText={setModel}
							placeholder="例: claude-sonnet-4-5-20250929"
							placeholderTextColor="#78716c"
							editable={!isSaving}
							autoCapitalize="none"
							autoCorrect={false}
							className={`w-full rounded-md border border-border p-3 text-fg ${
								isSaving ? "opacity-50" : ""
							}`}
						/>
						<Text className="text-xs text-fg-muted">
							空欄の場合はプロバイダのデフォルトモデルを使用します
						</Text>
					</View>
				)}
			</View>

			{/* 結果メッセージ */}
			{message && (
				<View
					className={`rounded-md p-3 ${
						message.type === "success" ? "bg-green-100" : "bg-red-100"
					}`}
					accessibilityRole="alert"
				>
					<Text
						className={
							message.type === "success" ? "text-green-800" : "text-red-800"
						}
					>
						{message.text}
					</Text>
				</View>
			)}

			{/* 保存ボタン */}
			<Pressable
				onPress={handleSave}
				disabled={!isSaveEnabled()}
				className={`items-center rounded-md p-3 ${
					isSaveEnabled() ? "bg-accent" : "bg-accent opacity-50"
				}`}
			>
				<Text className="font-medium text-white">
					{isSaving ? "保存中..." : "保存する"}
				</Text>
			</Pressable>
		</View>
	);
}
