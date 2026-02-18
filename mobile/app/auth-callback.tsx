/**
 * OAuth コールバック画面
 *
 * Web: Google OAuth 完了後に Hono API からリダイレクトされる画面。
 * URL パラメータからワンタイム認可コードのみを受け取り、
 * POST /auth/exchange-code でJWTを取得してストレージに保存する。
 * （CWE-598 対策: JWTをURLパラメータに露出させない）
 *
 * Mobile: この画面は使用しない（expo-auth-session がコールバックを処理する）
 */
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { AUTH_CONFIG } from "../src/auth/config";
import type { StoredUser } from "../src/auth/storage";
import {
	saveRefreshToken,
	saveToken,
	saveUser,
} from "../src/auth/storage";

/** エラー表示後にサインイン画面へ戻るまでの遅延(ms) */
const REDIRECT_DELAY_MS = 3000;

/**
 * エラーメッセージを設定し、一定時間後にサインイン画面へリダイレクトする
 */
function showErrorAndRedirect(
	setError: (msg: string) => void,
	message: string,
): void {
	setError(message);
	setTimeout(() => {
		router.replace("/sign-in");
	}, REDIRECT_DELAY_MS);
}

export default function AuthCallbackScreen() {
	const [error, setError] = useState<string | null>(null);

	const params = useLocalSearchParams<{
		code?: string;
		error?: string;
		message?: string;
	}>();

	useEffect(() => {
		(async () => {
			// エラーパラメータがある場合
			if (params.error || params.message) {
				showErrorAndRedirect(setError, params.message ?? "認証に失敗しました");
				return;
			}

			// ワンタイム認可コードがある場合: exchange-code でJWTを取得
			if (params.code) {
				try {
					const res = await fetch(
						`${AUTH_CONFIG.apiBaseUrl}/auth/exchange-code`,
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							credentials: "include",
							body: JSON.stringify({ code: params.code }),
						},
					);

					if (!res.ok) {
						const errorData = (await res.json().catch(() => ({}))) as {
							error?: string;
						};
						throw new Error(
							errorData.error ?? `認可コード交換失敗: ${res.status}`,
						);
					}

					const data = (await res.json()) as {
						token: string;
						refreshToken: string;
						user: StoredUser;
					};

					// トークンとユーザー情報を並列保存
					const savePromises: Promise<void>[] = [
						saveToken(data.token),
						saveUser(data.user),
					];

					// Mobile のみ: リフレッシュトークンを SecureStore に保存
					// Web は httpOnly Cookie で管理されるため保存不要
					if (Platform.OS !== "web") {
						savePromises.push(saveRefreshToken(data.refreshToken));
					}

					await Promise.all(savePromises);

					router.replace("/(auth)");
				} catch (e) {
					console.error("[auth-callback] コード交換エラー:", e);
					const message =
						e instanceof Error
							? e.message
							: "認証情報の取得に失敗しました";
					showErrorAndRedirect(setError, message);
				}
				return;
			}

			// パラメータが不足している場合
			showErrorAndRedirect(setError, "認証パラメータが不足しています");
		})();
	}, [params.code, params.error, params.message]);

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
