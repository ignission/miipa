/**
 * 認証設定
 */
export const AUTH_CONFIG = {
	/** バックエンドのベースURL */
	apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://miipa.app",
	/** Google OAuth クライアントID (iOS) */
	googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
	/** モバイルトークン発行エンドポイント */
	tokenEndpoint: "/api/auth/mobile/token",
} as const;
