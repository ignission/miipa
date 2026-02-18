import "../global.css";

import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GluestackUIProvider } from "../components/ui/gluestack-ui-provider";
import { AuthProvider } from "../src/auth";
import { registerBackgroundSync } from "../src/store/background-sync";

// スプラッシュスクリーンを自動非表示にしない
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5分
			retry: 2,
		},
	},
});

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	// バックグラウンド同期を登録
	useEffect(() => {
		registerBackgroundSync();
	}, []);

	if (!loaded) {
		return null;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
				<AuthProvider>
					<ThemeProvider
						value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
					>
						<Stack>
							<Stack.Screen name="index" options={{ headerShown: false }} />
							<Stack.Screen name="sign-in" options={{ headerShown: false }} />
							<Stack.Screen
								name="auth-callback"
								options={{ headerShown: false }}
							/>
							<Stack.Screen name="(auth)" options={{ headerShown: false }} />
							<Stack.Screen
								name="privacy"
								options={{ title: "プライバシーポリシー" }}
							/>
							<Stack.Screen name="terms" options={{ title: "利用規約" }} />
							<Stack.Screen
								name="tokushoho"
								options={{ title: "特定商取引法に基づく表記" }}
							/>
							<Stack.Screen name="+not-found" />
						</Stack>
						<StatusBar style="auto" />
					</ThemeProvider>
				</AuthProvider>
			</GluestackUIProvider>
		</QueryClientProvider>
	);
}
