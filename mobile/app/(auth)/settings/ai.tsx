/**
 * AI設定画面
 *
 * Web版 app/settings/ai/page.tsx に対応する Expo Router 画面です。
 * AIプロバイダ・モデルの表示・変更を行います。
 *
 * @module app/(auth)/settings/ai
 */

import { Stack } from "expo-router";
import { ScrollView, View } from "react-native";
import { AiSettings } from "../../../src/components/settings/ai-settings";

export default function AiSettingsScreen() {
	return (
		<>
			<Stack.Screen options={{ title: "AI設定" }} />
			<ScrollView className="flex-1 bg-bg-canvas">
				<View className="mx-auto w-full max-w-2xl p-4">
					<AiSettings />
				</View>
			</ScrollView>
		</>
	);
}
