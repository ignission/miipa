/**
 * セットアップ画面
 *
 * Web版 app/setup/page.tsx に対応する Expo Router 画面です。
 * セットアップウィザード（カレンダー設定 → AI設定 → 完了）を表示します。
 *
 * @module app/(auth)/setup
 */

import { router, Stack } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../src/auth";
import { ApiKeyForm } from "../../src/components/setup/api-key-form";
import { CalendarSetup } from "../../src/components/setup/calendar-setup";
import { OllamaConnector } from "../../src/components/setup/ollama-connector";
import { ProviderSelector } from "../../src/components/setup/provider-selector";
import { SetupComplete } from "../../src/components/setup/setup-complete";
import { SetupStepper } from "../../src/components/setup/setup-stepper";
import type { LLMProvider, SetupStep } from "../../src/components/setup/types";
import { useCalendars } from "../../src/hooks/useCalendars";

export default function SetupScreen() {
	const { signIn } = useAuth();
	const { calendars, isLoading: isLoadingCalendars } = useCalendars();

	// ステップ管理
	const [currentStep, setCurrentStep] = useState<SetupStep>("calendar");

	// AI設定
	const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(
		null,
	);
	const [apiKeyValidated, setApiKeyValidated] = useState(false);
	const [ollamaConnected, setOllamaConnected] = useState(false);
	const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");

	// Google認証
	const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);
	const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

	/**
	 * カレンダーステップ完了時
	 */
	const handleCalendarComplete = useCallback(() => {
		setCurrentStep("ai");
	}, []);

	/**
	 * AIステップ完了時
	 */
	const handleAiComplete = useCallback(() => {
		setCurrentStep("complete");
	}, []);

	/**
	 * セットアップ完了時：メイン画面へ遷移
	 */
	const handleStart = useCallback(() => {
		router.replace("/(auth)");
	}, []);

	/**
	 * カレンダー設定画面へ遷移
	 */
	const handleNavigateToCalendarSettings = useCallback(() => {
		router.push("/(auth)/settings/calendars");
	}, []);

	/**
	 * Google認証フローの開始
	 * TODO: Google OAuth フロー実装後に接続
	 */
	const handleStartAuth = useCallback(async () => {
		setIsGoogleAuthLoading(true);
		setGoogleAuthError(null);
		try {
			// TODO: Google OAuth 認証フロー
			await signIn();
		} catch (e) {
			setGoogleAuthError(e instanceof Error ? e.message : "認証に失敗しました");
		} finally {
			setIsGoogleAuthLoading(false);
		}
	}, [signIn]);

	/**
	 * ステップに応じたコンテンツをレンダリング
	 */
	const renderStepContent = () => {
		switch (currentStep) {
			case "calendar":
				return (
					<CalendarSetup
						onComplete={handleCalendarComplete}
						startAuth={handleStartAuth}
						isAuthLoading={isGoogleAuthLoading}
						authError={googleAuthError}
						calendars={(calendars ?? []).map((c) => ({
							id: String(c.id),
							name: c.name,
							type: ((c as { type?: string }).type ?? "google") as
								| "google"
								| "ical",
						}))}
						isLoading={isLoadingCalendars}
					/>
				);

			case "ai":
				return (
					<View className="gap-6">
						{/* プロバイダ選択 */}
						<ProviderSelector
							selectedProvider={selectedProvider}
							onSelect={(provider) => {
								setSelectedProvider(provider);
								setApiKeyValidated(false);
								setOllamaConnected(false);
							}}
						/>

						{/* プロバイダに応じた設定フォーム */}
						{selectedProvider &&
							(selectedProvider === "ollama" ? (
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
									onKeyChange={() => setApiKeyValidated(false)}
								/>
							))}

						{/* 次へ / スキップ */}
						<View className="items-center gap-3 pt-4">
							{/* 次へボタン */}
							<Pressable
								onPress={handleAiComplete}
								disabled={
									!selectedProvider ||
									(selectedProvider === "ollama"
										? !ollamaConnected
										: !apiKeyValidated)
								}
								className={`w-full items-center rounded-lg px-6 py-3 ${
									selectedProvider &&
									(
										selectedProvider === "ollama"
											? ollamaConnected
											: apiKeyValidated
									)
										? "bg-accent"
										: "bg-bg-muted"
								}`}
							>
								<Text
									className={`font-medium ${
										selectedProvider &&
										(
											selectedProvider === "ollama"
												? ollamaConnected
												: apiKeyValidated
										)
											? "text-white"
											: "text-fg-muted"
									}`}
								>
									次へ進む
								</Text>
							</Pressable>

							{/* スキップリンク */}
							<Pressable onPress={handleAiComplete}>
								<Text className="text-sm text-fg-muted underline">
									後で設定する
								</Text>
							</Pressable>
						</View>
					</View>
				);

			case "complete":
				return (
					<SetupComplete
						provider={selectedProvider}
						onStart={handleStart}
						onNavigateToCalendarSettings={handleNavigateToCalendarSettings}
					/>
				);
		}
	};

	return (
		<>
			<Stack.Screen options={{ title: "セットアップ" }} />
			<ScrollView className="flex-1 bg-bg-canvas">
				<View className="mx-auto w-full max-w-2xl p-4">
					{/* ステッパー */}
					<SetupStepper currentStep={currentStep} />

					{/* ステップコンテンツ */}
					<View className="mt-6">{renderStepContent()}</View>
				</View>
			</ScrollView>
		</>
	);
}
