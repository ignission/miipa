/**
 * OAuth設定ヘルパー
 *
 * 環境変数から OAuthConfig を構築する共通処理。
 * auth.ts と calendars.ts で共有されます。
 *
 * @module packages/api/src/lib/auth/oauth-config
 */

import type { Bindings } from "@/context/app-context";
import type { OAuthConfig } from "@/lib/infrastructure/calendar/oauth-service";

/**
 * 環境変数から OAuthConfig を構築
 *
 * @param env - Cloudflare Workers バインディング
 * @returns OAuthConfig
 */
export function getOAuthConfig(env: Bindings): OAuthConfig {
	const baseUrl =
		env.ENVIRONMENT === "production"
			? "https://api.miipa.app"
			: "http://localhost:8787";
	return {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		redirectUri: `${baseUrl}/auth/google/callback`,
	};
}
