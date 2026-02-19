/**
 * APIキー入力フォームコンポーネント
 *
 * 選択されたLLMプロバイダのAPIキーを入力・検証するためのフォームを提供します。
 *
 * @module components/setup/api-key-form
 */

import { useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import { validateApiKey } from "../../api/setup";
import { type LLMProvider, PROVIDER_INFO } from "./types";

// ============================================================
// 型定義
// ============================================================

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

/** validateApiKey のレスポンス型を再利用 */
type ValidationResult = Awaited<ReturnType<typeof validateApiKey>>;

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * APIキー入力フォーム
 *
 * LLMプロバイダのAPIキーを入力し、検証するためのフォームコンポーネントです。
 * - APIキーの入力（パスワードマスク付き）
 * - 表示/非表示の切り替え
 * - APIキーの検証
 * - 検証結果の表示
 * - ヘルプリンク
 */
export function ApiKeyForm({
	provider,
	onValidated,
	onKeyChange,
}: ApiKeyFormProps) {
	const [apiKey, setApiKey] = useState("");
	const [showKey, setShowKey] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [validationResult, setValidationResult] =
		useState<ValidationResult | null>(null);

	const info = PROVIDER_INFO[provider];

	/**
	 * APIキーの検証を実行
	 */
	const handleValidate = async () => {
		if (!apiKey.trim()) return;

		setIsValidating(true);
		setValidationResult(null);

		try {
			const result = await validateApiKey({ provider, apiKey });
			if (!result) {
				setValidationResult({
					valid: false,
					error: {
						code: "NULL_RESPONSE",
						message: "APIキーの検証に失敗しました",
					},
				});
				onValidated(false);
				return;
			}
			setValidationResult(result);
			onValidated(result.valid);
		} catch {
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

	return (
		<View className="gap-4">
			{/* プロバイダ情報 */}
			<View className="flex-row items-center gap-3">
				<Text className="text-lg font-semibold text-fg">{info.name}</Text>
			</View>

			{/* APIキー入力 */}
			<View className="gap-2">
				<Text className="font-medium text-fg">APIキー</Text>
				<View className="flex-row gap-2">
					<View className="relative flex-1">
						<TextInput
							value={apiKey}
							onChangeText={(text) => {
								setApiKey(text);
								onKeyChange(text);
								setValidationResult(null);
							}}
							placeholder={`${info.name}のAPIキーを入力`}
							placeholderTextColor="#78716c"
							secureTextEntry={!showKey}
							autoCapitalize="none"
							autoCorrect={false}
							className="w-full rounded-md border border-border p-3 pr-10 text-fg"
						/>
						<Pressable
							onPress={() => setShowKey(!showKey)}
							accessibilityLabel={showKey ? "APIキーを隠す" : "APIキーを表示"}
							className="absolute right-3 top-1/2 -translate-y-1/2"
						>
							<Text className="text-fg-muted">{showKey ? "隠す" : "表示"}</Text>
						</Pressable>
					</View>
				</View>
			</View>

			{/* ヘルプリンク */}
			{info.apiKeyHelpUrl && (
				<Pressable
					onPress={() => {
						if (info.apiKeyHelpUrl) {
							Linking.openURL(info.apiKeyHelpUrl);
						}
					}}
					accessibilityRole="link"
				>
					<Text className="text-sm text-accent underline">
						APIキーの取得方法
					</Text>
				</Pressable>
			)}

			{/* 検証ボタン */}
			<Pressable
				onPress={handleValidate}
				disabled={!apiKey.trim() || isValidating}
				className={`items-center rounded-md p-3 ${
					!apiKey.trim() || isValidating ? "bg-accent opacity-50" : "bg-accent"
				}`}
			>
				<Text className="font-medium text-white">
					{isValidating ? "検証中..." : "検証する"}
				</Text>
			</Pressable>

			{/* 検証結果 */}
			{validationResult && (
				<View
					className={`rounded-md p-3 ${
						validationResult.valid ? "bg-green-100" : "bg-red-100"
					}`}
					accessibilityRole="alert"
				>
					<Text
						className={
							validationResult.valid ? "text-green-800" : "text-red-800"
						}
					>
						{validationResult.valid
							? "APIキーの検証に成功しました"
							: validationResult.error?.message ||
								"APIキーの検証に失敗しました"}
					</Text>
				</View>
			)}
		</View>
	);
}
