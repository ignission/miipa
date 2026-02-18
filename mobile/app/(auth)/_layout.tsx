import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { TabBarIcon } from "../../components/navigation/TabBarIcon";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../src/auth";

// TODO: フェーズ4 - Web対応
// - Platform.OS === "web" の場合にサイドバーナビゲーションに切り替え
// - NativeWind className によるレスポンシブレイアウト適用
// - Web用のヘッダーコンポーネント追加

export default function AuthLayout() {
	const { isAuthenticated, isLoading } = useAuth();
	const colorScheme = useColorScheme();

	// 認証状態の読み込み中はprotectedコンテンツを表示しない
	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" color="#F97316" />
			</View>
		);
	}

	// 未認証ならサインイン画面にリダイレクト
	if (!isAuthenticated) {
		return <Redirect href="/sign-in" />;
	}

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
				headerShown: true,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "今日",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "calendar" : "calendar-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="week"
				options={{
					title: "今週",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "calendar-number" : "calendar-number-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "設定",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "settings" : "settings-outline"}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
