/** Google OAuth iOS用クライアントID */
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
/** Google OAuth Web用クライアントID（IDトークン検証に使用） */
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

if (!googleIosClientId) {
	console.error(
		"[auth/config] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID が設定されていません。Google認証が動作しません。",
	);
}

/**
 * 認証設定
 */
export const AUTH_CONFIG = {
	/** バックエンドのベースURL */
	apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://miipa.app",
	/** Google OAuth クライアントID (iOS) */
	googleIosClientId,
	/** Google OAuth クライアントID (Web) - IDトークンのaudience用 */
	googleWebClientId,
	/** モバイルトークン発行エンドポイント */
	tokenEndpoint: "/api/auth/mobile/token",
} as const;
