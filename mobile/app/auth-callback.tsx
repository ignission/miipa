/**
 * OAuth コールバック画面
 *
 * Web: Google OAuth 完了後に Hono API からリダイレクトされる画面。
 * URL パラメータからトークンとユーザー情報を受け取り、
 * ストレージに保存してメイン画面にリダイレクトする。
 *
 * Mobile: この画面は使用しない（expo-auth-session がコールバックを処理する）
 */
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import {
	saveRefreshToken,
	saveToken,
	saveUser,
} from "../src/auth/storage";

export default function AuthCallbackScreen() {
	const [error, setError] = useState<string | null>(null);

	const params = useLocalSearchParams<{
		token?: string;
		refreshToken?: string;
		userId?: string;
		email?: string;
		name?: string;
		error?: string;
		message?: string;
	}>();

	useEffect(() => {
		(async () => {
			// エラーパラメータがある場合
			if (params.error || params.message) {
				setError(params.message ?? "認証に失敗しました");
				// 3秒後にサインイン画面に戻る
				setTimeout(() => {
					router.replace("/sign-in");
				}, 3000);
				return;
			}

			// トークンがある場合: 保存してメイン画面へ
			if (params.token && params.refreshToken) {
				try {
					await saveToken(params.token);
					await saveRefreshToken(params.refreshToken);

					if (params.userId && params.email) {
						await saveUser({
							id: params.userId,
							email: params.email,
							name: params.name ?? "",
							image: null,
						});
					}

					// 認証済み画面にリダイレクト
					router.replace("/(auth)");
				} catch (e) {
					console.error("[auth-callback] トークン保存エラー:", e);
					setError("認証情報の保存に失敗しました");
					setTimeout(() => {
						router.replace("/sign-in");
					}, 3000);
				}
				return;
			}

			// パラメータが不足している場合
			setError("認証パラメータが不足しています");
			setTimeout(() => {
				router.replace("/sign-in");
			}, 3000);
		})();
	}, [params.token, params.refreshToken, params.userId, params.email, params.name, params.error, params.message]);

	return (
		<View style={styles.container}>
			{error ? (
				<>
					<Text style={styles.errorText}>{error}</Text>
					<Text style={styles.subText}>サインイン画面に戻ります...</Text>
				</>
			) : (
				<>
					<ActivityIndicator size="large" color="#EA580C" />
					<Text style={styles.loadingText}>認証処理中...</Text>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF7ED",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	loadingText: {
		marginTop: 16,
		fontSize: 16,
		color: "#9A3412",
	},
	errorText: {
		fontSize: 16,
		color: "#DC2626",
		textAlign: "center",
		marginBottom: 8,
	},
	subText: {
		fontSize: 14,
		color: "#9A3412",
	},
});
