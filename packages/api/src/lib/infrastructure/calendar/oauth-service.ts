/**
 * Google OAuth 2.0 サービス（Hono版）
 *
 * Google Calendar API アクセスのための OAuth 2.0 PKCE フローを実装。
 * process.env ではなく引数で設定値を受け取るように変更。
 *
 * @module packages/api/src/lib/infrastructure/calendar/oauth-service
 */

import {
	apiError,
	authRequired,
	type CalendarError,
	networkError,
} from "@/lib/domain/calendar";
import { err, ok, type Result } from "@/lib/domain/shared";
import { base64UrlEncode } from "@/lib/utils/base64url";

// ============================================================
// 型定義
// ============================================================

/** OAuth設定（Honoのc.envから渡される） */
export interface OAuthConfig {
	readonly clientId: string;
	readonly clientSecret: string;
	readonly redirectUri: string;
}

/**
 * OAuthトークン
 */
export interface OAuthTokens {
	readonly accessToken: string;
	readonly refreshToken: string;
	readonly expiresAt: Date;
}

/**
 * 認証URL情報
 */
export interface AuthUrlInfo {
	readonly url: string;
	readonly codeVerifier: string;
	readonly state: string;
}

/**
 * Google Calendar API スコープ
 * 読み取り専用アクセスのみを要求（セキュリティ考慮）
 */
const SCOPES = [
	"https://www.googleapis.com/auth/calendar.readonly",
	"https://www.googleapis.com/auth/userinfo.email",
] as const;

// ============================================================
// 内部ユーティリティ関数
// ============================================================

function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await crypto.subtle.digest(
		"SHA-256",
		data.buffer as ArrayBuffer,
	);
	return base64UrlEncode(new Uint8Array(hash));
}

function generateState(): string {
	const array = new Uint8Array(16);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================
// 公開関数
// ============================================================

/**
 * OAuth 認証 URL を生成（PKCE対応）
 *
 * @param config - OAuth設定（clientId, clientSecret, redirectUri）
 * @param loginHint - Google認証画面で事前選択するメールアドレス（オプション）
 */
export async function generateAuthUrl(
	config: OAuthConfig,
	loginHint?: string,
): Promise<Result<AuthUrlInfo, CalendarError>> {
	if (!config.clientId) {
		return err(authRequired("GOOGLE_CLIENT_IDが設定されていません"));
	}

	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);
	const state = generateState();

	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		response_type: "code",
		scope: SCOPES.join(" "),
		access_type: "offline",
		prompt: "consent select_account",
		code_challenge: codeChallenge,
		code_challenge_method: "S256",
		state,
	});

	if (loginHint) {
		params.set("login_hint", loginHint);
	}

	const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

	return ok({ url, codeVerifier, state });
}

/**
 * 認証コードをトークンに交換
 */
export async function exchangeCode(
	config: OAuthConfig,
	code: string,
	codeVerifier: string,
): Promise<Result<OAuthTokens, CalendarError>> {
	if (!config.clientId || !config.clientSecret) {
		return err(authRequired("Google OAuth設定が不足しています"));
	}

	try {
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				code,
				client_id: config.clientId,
				client_secret: config.clientSecret,
				redirect_uri: config.redirectUri,
				grant_type: "authorization_code",
				code_verifier: codeVerifier,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(
				"Google token exchange failed:",
				response.status,
				errorBody,
			);
			return err(
				apiError(
					`トークンの取得に失敗しました（ステータス: ${response.status}）`,
					response.status,
				),
			);
		}

		const tokens = (await response.json()) as {
			access_token?: string;
			refresh_token?: string;
			expires_in?: number;
		};

		if (!tokens.access_token || !tokens.refresh_token) {
			return err(apiError("トークンの取得に失敗しました", 400));
		}

		const expiresAt = tokens.expires_in
			? new Date(Date.now() + tokens.expires_in * 1000)
			: new Date(Date.now() + 3600 * 1000);

		return ok({
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			expiresAt,
		});
	} catch (error) {
		return err(networkError("トークン交換に失敗しました", error));
	}
}

/**
 * リフレッシュトークンでアクセストークンを更新
 */
export async function refreshToken(
	config: OAuthConfig,
	refreshTokenValue: string,
): Promise<Result<OAuthTokens, CalendarError>> {
	if (!config.clientId || !config.clientSecret) {
		return err(authRequired("Google OAuth設定が不足しています"));
	}

	try {
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				refresh_token: refreshTokenValue,
				client_id: config.clientId,
				client_secret: config.clientSecret,
				grant_type: "refresh_token",
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(
				"Google token refresh failed:",
				response.status,
				errorBody,
			);
			return err(
				apiError(
					`アクセストークンの更新に失敗しました（ステータス: ${response.status}）`,
					response.status,
				),
			);
		}

		const credentials = (await response.json()) as {
			access_token?: string;
			refresh_token?: string;
			expires_in?: number;
		};

		if (!credentials.access_token) {
			return err(apiError("アクセストークンの更新に失敗しました", 400));
		}

		const expiresAt = credentials.expires_in
			? new Date(Date.now() + credentials.expires_in * 1000)
			: new Date(Date.now() + 3600 * 1000);

		return ok({
			accessToken: credentials.access_token,
			refreshToken: credentials.refresh_token || refreshTokenValue,
			expiresAt,
		});
	} catch (error) {
		return err(networkError("トークン更新に失敗しました", error));
	}
}

/**
 * トークンが有効期限切れかどうかを判定
 */
export function isTokenExpired(expiresAt: Date): boolean {
	const bufferMs = 5 * 60 * 1000; // 5分のバッファ
	return new Date(Date.now() + bufferMs) >= expiresAt;
}
