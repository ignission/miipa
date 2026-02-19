/**
 * サインイン画面
 *
 * 未認証ユーザーにサインインUIを表示します。
 * 全プラットフォームで統一されたサインイン画面を提供します。
 *
 * @module app/sign-in
 */

import { Redirect } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useAuth } from "../src/auth";

export default function SignInScreen() {
	const { isAuthenticated, isLoading, isSigningIn, signIn } = useAuth();

	// 初期化中はローディング表示
	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-orange-50">
				<ActivityIndicator size="large" color="#F97316" />
			</View>
		);
	}

	// 認証済みならタブ画面にリダイレクト
	if (isAuthenticated) {
		return <Redirect href="/(auth)/home" />;
	}

	return (
		<View className="flex-1 items-center justify-center bg-orange-50 p-6">
			{/* キャラクターエリア */}
			<View className="mb-12 items-center">
				<Text className="mb-4 text-7xl">🐾</Text>
				<Text className="mb-2 text-4xl font-bold text-orange-600">miipa</Text>
				<Text className="text-base text-orange-900">
					今日の予定を30秒で把握
				</Text>
			</View>

			{/* ログインボタン */}
			<View className="w-full max-w-xs">
				<Pressable
					className="items-center rounded-xl bg-orange-600 px-6 py-4 shadow-md active:bg-orange-700"
					onPress={signIn}
					disabled={isSigningIn}
				>
					{isSigningIn ? (
						<ActivityIndicator size="small" color="#fff" />
					) : (
						<Text className="text-base font-semibold text-white">
							Google でログイン
						</Text>
					)}
				</Pressable>
			</View>
		</View>
	);
}
