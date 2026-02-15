/** Google OAuth クライアントID（未設定の場合は警告を出して空文字にフォールバック） */
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";
if (!googleClientId) {
	console.error(
		"[auth/config] EXPO_PUBLIC_GOOGLE_CLIENT_ID が設定されていません。Google認証が動作しません。",
	);
}

/**
 * 認証設定
 */
export const AUTH_CONFIG = {
	/** バックエンドのベースURL */
	apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://miipa.app",
	/** Google OAuth クライアントID (iOS) */
	googleClientId,
	/** モバイルトークン発行エンドポイント */
	tokenEndpoint: "/api/auth/mobile/token",
} as const;
