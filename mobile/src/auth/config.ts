import { Platform } from "react-native";

/** Google OAuth iOS用クライアントID */
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
/** Google OAuth Web用クライアントID（IDトークン検証に使用） */
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

if (Platform.OS !== "web" && !googleIosClientId) {
	console.error(
		"[auth/config] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID が設定されていません。Google認証が動作しません。",
	);
}

/**
 * 認証設定
 *
 * Web: API ベースURLは Hono API サーバーを指す（CORS対応）
 * Mobile: 既存のバックエンドURLをそのまま使用
 */
export const AUTH_CONFIG = {
	/** バックエンドのベースURL */
	apiBaseUrl:
		Platform.OS === "web"
			? (process.env.EXPO_PUBLIC_API_BASE_URL ?? "")
			: (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://miipa.app"),
	/** Google OAuth クライアントID (iOS) */
	googleIosClientId,
	/** Google OAuth クライアントID (Web) - IDトークンのaudience用 */
	googleWebClientId,
	/** トークン発行エンドポイント（Hono APIルート） */
	tokenEndpoint: "/auth/mobile/token",
	/** Google OAuth 開始エンドポイント（Web用） */
	googleAuthEndpoint: "/auth/google",
	/** リフレッシュエンドポイント（Web用Cookie対応） */
	refreshEndpoint: "/auth/refresh",
	/** ログアウトエンドポイント */
	logoutEndpoint: "/auth/logout",
} as const;
