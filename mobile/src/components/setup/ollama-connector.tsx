/**
 * Ollama接続確認コンポーネント
 *
 * Ollamaサーバーへの接続確認とモデル一覧の取得を行うコンポーネントです。
 * APIキーは不要で、サーバーURLのみで接続できます。
 *
 * @module components/setup/ollama-connector
 */

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AUTH_CONFIG } from "../../auth/config";

// ============================================================
// 型定義
// ============================================================

/**
 * OllamaConnectorコンポーネントのProps
 */
interface OllamaConnectorProps {
	/** 接続成功時のコールバック（接続先URLを引数で通知） */
	onConnected: (connectedUrl: string) => void;
	/** デフォルトURL */
	defaultUrl?: string;
}

/** 接続状態 */
type Status = "idle" | "connecting" | "connected" | "error";

/** 接続結果の型 */
interface ConnectionResult {
	valid: boolean;
	models?: string[];
	error?: { code: string; message: string };
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * Ollama接続確認コンポーネント
 *
 * Ollamaサーバーへの接続を確認し、利用可能なモデル一覧を表示します。
 */
export function OllamaConnector({
	onConnected,
	defaultUrl = "http://localhost:11434",
}: OllamaConnectorProps) {
	const [url, setUrl] = useState(defaultUrl);
	const [status, setStatus] = useState<Status>("idle");
	const [availableModels, setAvailableModels] = useState<string[]>([]);
	const [errorMessage, setErrorMessage] = useState("");

	/**
	 * 接続確認を実行
	 */
	const handleConnect = async () => {
		setStatus("connecting");
		setErrorMessage("");

		try {
			const response = await fetch(
				`${AUTH_CONFIG.apiBaseUrl}/api/setup/validate-key`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ provider: "ollama", apiKey: url }),
				},
			);

			const result: ConnectionResult = await response.json();

			if (result.valid) {
				setStatus("connected");
				setAvailableModels(result.models || []);
				onConnected(url);
			} else {
				setStatus("error");
				setErrorMessage(result.error?.message || "接続に失敗しました");
			}
		} catch {
			setStatus("error");
			setErrorMessage("ネットワークエラーが発生しました");
		}
	};

	return (
		<View className="gap-4">
			{/* Ollama情報 */}
			<View className="flex-row items-center gap-3">
				<Text className="text-lg font-semibold text-fg">Ollama</Text>
			</View>

			<Text className="text-sm text-fg-muted">
				Ollamaサーバーに接続します。APIキーは不要です。
			</Text>

			{/* URL入力 */}
			<View className="gap-2">
				<Text className="font-medium text-fg">サーバーURL</Text>
				<TextInput
					value={url}
					onChangeText={setUrl}
					placeholder="http://localhost:11434"
					placeholderTextColor="#78716c"
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="url"
					className="w-full rounded-md border border-border p-3 text-fg"
				/>
			</View>

			{/* 接続確認ボタン */}
			<Pressable
				onPress={handleConnect}
				disabled={status === "connecting"}
				className={`items-center rounded-md p-3 ${
					status === "connecting"
						? "bg-accent opacity-50"
						: "bg-accent"
				}`}
			>
				<Text className="font-medium text-white">
					{status === "connecting" ? "接続中..." : "接続確認"}
				</Text>
			</Pressable>

			{/* 接続成功 */}
			{status === "connected" && (
				<View className="rounded-md bg-green-100 p-3" accessibilityRole="alert">
					<Text className="mb-2 font-medium text-green-800">
						接続に成功しました
					</Text>
					{availableModels.length > 0 && (
						<View>
							<Text className="mb-1 text-sm text-green-800">
								利用可能なモデル:
							</Text>
							{availableModels.slice(0, 5).map((model) => (
								<Text
									key={model}
									className="pl-4 text-sm text-green-800"
								>
									- {model}
								</Text>
							))}
							{availableModels.length > 5 && (
								<Text className="pl-4 text-sm text-green-800">
									他 {availableModels.length - 5} モデル
								</Text>
							)}
						</View>
					)}
				</View>
			)}

			{/* エラー */}
			{status === "error" && (
				<View className="rounded-md bg-red-100 p-3" accessibilityRole="alert">
					<Text className="mb-2 font-medium text-red-800">
						接続に失敗しました
					</Text>
					<Text className="text-sm text-red-800">{errorMessage}</Text>
					<Text className="mt-2 text-sm text-red-600">
						Ollamaが起動していない場合は ollama serve を実行してください
					</Text>
				</View>
			)}
		</View>
	);
}
