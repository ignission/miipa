import { Redirect } from "expo-router";
import { Platform, Pressable, Text, View } from "react-native";
import { useAuth } from "../src/auth";

export default function IndexScreen() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-bg-canvas">
				<Text className="text-fg-muted">読み込み中...</Text>
			</View>
		);
	}

	if (isAuthenticated) {
		return <Redirect href="/(auth)" />;
	}

	// Web: ランディングページ / Mobile: サインインにリダイレクト
	if (Platform.OS !== "web") {
		return <Redirect href="/sign-in" />;
	}

	return (
		<View className="flex-1 items-center justify-center bg-bg-canvas">
			<Text className="text-4xl font-bold text-fg">miipa</Text>
			<Text className="mt-2 text-fg-muted">
				一人社長のためのAIカレンダーアシスタント
			</Text>
			<Pressable
				className="mt-8 rounded-lg bg-accent px-6 py-3"
				onPress={() => {
					/* サインイン処理 - フェーズ5で実装 */
				}}
			>
				<Text className="font-semibold text-accent-fg">はじめる</Text>
			</Pressable>
		</View>
	);
}
