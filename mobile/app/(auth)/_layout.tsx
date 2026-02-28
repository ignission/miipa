/**
 * 認証済み画面レイアウト
 *
 * 認証状態を確認し、未認証ならサインイン画面にリダイレクトします。
 * タブナビゲーション（ホーム / AI / 設定）を提供し、
 * 設定サブ画面・セットアップ・チャットの Stack.Screen も含みます。
 *
 * @module app/(auth)/_layout
 */

import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { Colors } from "../../constants/Colors";
import { useAuth } from "../../src/auth";
import { TabBarIcon } from "../../src/components/navigation/TabBarIcon";

export default function AuthLayout() {
	const { isAuthenticated, isLoading } = useAuth();
	const colorScheme = useColorScheme();

	// 認証状態の読み込み中はprotectedコンテンツを表示しない
	if (isLoading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<ActivityIndicator size="large" color="#F97316" />
			</View>
		);
	}

	// 未認証ならサインイン画面にリダイレクト
	if (!isAuthenticated) {
		return <Redirect href="/" />;
	}

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors.light.tint,
				tabBarStyle: { backgroundColor: "#ffffff" },
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="home"
				options={{
					title: "ホーム",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "home" : "home-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="week"
				options={{
					href: null,
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
				name="month"
				options={{
					href: null,
					title: "月",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={focused ? "calendar-clear" : "calendar-clear-outline"}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="chat"
				options={{
					title: "AI",
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon
							name={
								focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"
							}
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

			{/* タブバーに表示しないが Tabs 外で管理する画面 */}
			<Tabs.Screen
				name="setup"
				options={{
					href: null,
					title: "セットアップ",
				}}
			/>
		</Tabs>
	);
}
