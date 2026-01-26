/**
 * Google OAuth 2.0 サービス
 *
 * Google Calendar API アクセスのための OAuth 2.0 PKCE フローを実装。
 * セキュリティを考慮し、PKCE（Proof Key for Code Exchange）方式を採用しています。
 *
 * @module lib/infrastructure/calendar/oauth-service
 *
 * @example
 * ```typescript
 * import { generateAuthUrl, exchangeCode, refreshToken } from '@/lib/infrastructure/calendar/oauth-service';
 *
 * // 1. 認証URLを生成
 * const authUrlResult = generateAuthUrl();
 * if (isOk(authUrlResult)) {
 *   // codeVerifier は安全に保存し、コールバック時に使用
 *   redirect(authUrlResult.value.url);
 * }
 *
 * // 2. コールバックでコードをトークンに交換
 * const tokensResult = await exchangeCode(code, savedCodeVerifier);
 *
 * // 3. トークン期限切れ時にリフレッシュ
 * const refreshedResult = await refreshToken(tokens.refreshToken);
 * ```
 */

import * as crypto from "node:crypto";
import { CodeChallengeMethod, type OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import {
	apiError,
	authRequired,
	type CalendarError,
	networkError,
} from "@/lib/domain/calendar";
import { err, ok, type Result } from "@/lib/domain/shared";

// ============================================================
// 定数
// ============================================================

/** Google OAuth クライアントID（環境変数から取得） */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/** Google OAuth クライアントシークレット（環境変数から取得） */
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/** OAuth コールバック URI（環境変数またはデフォルト） */
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/google/callback`;

/**
 * Google Calendar API スコープ
 * 読み取り専用アクセスのみを要求（セキュリティ考慮）
 */
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
] as const;

// ============================================================
// 型定義
// ============================================================

/**
 * OAuthトークン
 *
 * Google OAuth 2.0 認証で取得するトークン情報。
 * アクセストークンとリフレッシュトークンを含みます。
 */
export interface OAuthTokens {
	/** API アクセス用トークン（短期間有効） */
	readonly accessToken: string;
	/** トークン更新用トークン（長期間有効） */
	readonly refreshToken: string;
	/** アクセストークンの有効期限 */
	readonly expiresAt: Date;
}

/**
 * 認証URL情報
 *
 * PKCE フローで使用する認証URL と関連情報。
 * codeVerifier はコールバック時のトークン交換で必要となるため、
 * 安全に保存しておく必要があります。
 */
export interface AuthUrlInfo {
	/** ユーザーをリダイレクトする認証URL */
	readonly url: string;
	/** PKCE code_verifier（トークン交換時に必要） */
	readonly codeVerifier: string;
	/** CSRF 対策用 state パラメータ */
	readonly state: string;
}

// ============================================================
// 内部ユーティリティ関数
// ============================================================

/**
 * PKCE code_verifier を生成
 *
 * 暗号学的に安全な乱数を生成し、Base64URL エンコードして返します。
 * RFC 7636 に準拠した 43-128 文字の文字列を生成します。
 *
 * @returns 32バイトの乱数をBase64URLエンコードした文字列
 */
function generateCodeVerifier(): string {
	return crypto.randomBytes(32).toString("base64url");
}

/**
 * PKCE code_challenge を生成
 *
 * code_verifier を SHA-256 でハッシュし、Base64URL エンコードして返します。
 * S256 チャレンジメソッドに対応しています。
 *
 * @param verifier - code_verifier 文字列
 * @returns SHA-256 ハッシュを Base64URL エンコードした文字列
 */
function generateCodeChallenge(verifier: string): string {
	return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * ランダムな state パラメータを生成
 *
 * CSRF（クロスサイトリクエストフォージェリ）対策として使用します。
 * コールバック時に一致を検証することで、リクエストの正当性を確認します。
 *
 * @returns 16バイトの乱数を16進数文字列に変換したもの
 */
function generateState(): string {
	return crypto.randomBytes(16).toString("hex");
}

/**
 * OAuth2 クライアントを作成
 *
 * @returns googleapis の OAuth2 クライアントインスタンス
 */
function createOAuth2Client(): OAuth2Client {
	return new google.auth.OAuth2(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		REDIRECT_URI,
	);
}

// ============================================================
// 公開関数
// ============================================================

/**
 * OAuth 認証 URL を生成
 *
 * Google OAuth 2.0 認証フローを開始するための URL を生成します。
 * PKCE（Proof Key for Code Exchange）方式を採用し、
 * 認可コード傍受攻撃（authorization code interception attack）を防止します。
 *
 * @returns 認証URL情報、または設定エラー
 *
 * @example
 * ```typescript
 * const result = generateAuthUrl();
 * if (isOk(result)) {
 *   const { url, codeVerifier, state } = result.value;
 *   // codeVerifier と state をセッションに保存
 *   // ユーザーを url にリダイレクト
 * }
 * ```
 */
export function generateAuthUrl(): Result<AuthUrlInfo, CalendarError> {
	if (!GOOGLE_CLIENT_ID) {
		return err(authRequired("GOOGLE_CLIENT_IDが設定されていません"));
	}

	const oauth2Client = createOAuth2Client();
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = generateCodeChallenge(codeVerifier);
	const state = generateState();

	const url = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: [...SCOPES],
		code_challenge: codeChallenge,
		code_challenge_method: CodeChallengeMethod.S256,
		state,
		prompt: "consent",
	});

	return ok({ url, codeVerifier, state });
}

/**
 * 認証コードをトークンに交換
 *
 * OAuth コールバックで受け取った認証コードを、
 * アクセストークンとリフレッシュトークンに交換します。
 * PKCE フローでは code_verifier の検証も行われます。
 *
 * @param code - OAuth コールバックで受け取った認証コード
 * @param codeVerifier - 認証URL生成時に作成した code_verifier
 * @returns OAuthトークン情報、またはエラー
 *
 * @example
 * ```typescript
 * // コールバックハンドラ内で使用
 * const result = await exchangeCode(code, savedCodeVerifier);
 * if (isOk(result)) {
 *   const { accessToken, refreshToken, expiresAt } = result.value;
 *   // トークンを Keychain に安全に保存
 * }
 * ```
 */
export async function exchangeCode(
	code: string,
	codeVerifier: string,
): Promise<Result<OAuthTokens, CalendarError>> {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
		return err(authRequired("Google OAuth設定が不足しています"));
	}

	const oauth2Client = createOAuth2Client();

	try {
		const { tokens } = await oauth2Client.getToken({
			code,
			codeVerifier,
		});

		if (!tokens.access_token || !tokens.refresh_token) {
			return err(apiError("トークンの取得に失敗しました", 400));
		}

		const expiresAt = tokens.expiry_date
			? new Date(tokens.expiry_date)
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
 *
 * アクセストークンの有効期限が切れた場合に、
 * リフレッシュトークンを使用して新しいアクセストークンを取得します。
 *
 * @param refreshTokenValue - 保存しているリフレッシュトークン
 * @returns 更新されたOAuthトークン情報、またはエラー
 *
 * @example
 * ```typescript
 * // トークン期限切れ時に使用
 * if (tokens.expiresAt < new Date()) {
 *   const result = await refreshToken(tokens.refreshToken);
 *   if (isOk(result)) {
 *     // 新しいトークンで Keychain を更新
 *   }
 * }
 * ```
 */
export async function refreshToken(
	refreshTokenValue: string,
): Promise<Result<OAuthTokens, CalendarError>> {
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
		return err(authRequired("Google OAuth設定が不足しています"));
	}

	const oauth2Client = createOAuth2Client();
	oauth2Client.setCredentials({ refresh_token: refreshTokenValue });

	try {
		const { credentials } = await oauth2Client.refreshAccessToken();

		if (!credentials.access_token) {
			return err(apiError("アクセストークンの更新に失敗しました", 400));
		}

		const expiresAt = credentials.expiry_date
			? new Date(credentials.expiry_date)
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
 *
 * 5分のバッファを設けて、期限切れ直前でもリフレッシュを促します。
 *
 * @param expiresAt - トークンの有効期限
 * @returns 有効期限切れ（または期限切れ間近）の場合は true
 *
 * @example
 * ```typescript
 * if (isTokenExpired(tokens.expiresAt)) {
 *   const refreshed = await refreshToken(tokens.refreshToken);
 *   // ...
 * }
 * ```
 */
export function isTokenExpired(expiresAt: Date): boolean {
	const bufferMs = 5 * 60 * 1000; // 5分のバッファ
	return new Date(Date.now() + bufferMs) >= expiresAt;
}
