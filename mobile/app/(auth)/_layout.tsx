import { Redirect, Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { useAuth } from "../../src/auth";
import { Colors } from "../../constants/Colors";
import { TabBarIcon } from "../../components/navigation/TabBarIcon";

export default function AuthLayout() {
	const { isAuthenticated, isLoading } = useAuth();
	const colorScheme = useColorScheme();

	// 未認証ならサインイン画面にリダイレクト
	if (!isLoading && !isAuthenticated) {
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
