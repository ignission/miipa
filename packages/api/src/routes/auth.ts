/**
 * 認証ルート
 *
 * JWT発行、Google OAuth、リフレッシュトークン、ログアウトを提供します。
 * 既存の app/api/auth/mobile/token/route.ts を Hono に移植。
 *
 * @module packages/api/src/routes/auth
 */

import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import type { AppType } from "@/context/app-context";
import { isOk } from "@/lib/domain/shared/result";
import {
	exchangeCode,
	generateAuthUrl,
	type OAuthConfig,
} from "@/lib/infrastructure/calendar/oauth-service";
import { verifyJwt } from "@/middleware/auth";

// ============================================================
// 定数
// ============================================================

/** アクセストークンの有効期限（秒）: 24時間 */
const ACCESS_TOKEN_EXPIRES_IN = 24 * 60 * 60;

/** リフレッシュトークンの有効期限（秒）: 30日 */
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60;

/** JWT Cookie名 */
const JWT_COOKIE_NAME = "miipa_token";

/** リフレッシュトークンCookie名 */
const REFRESH_TOKEN_COOKIE_NAME = "miipa_refresh_token";

/** Google OAuth code_verifier Cookie名 */
const CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";

/** Google OAuth state Cookie名 */
const OAUTH_STATE_COOKIE = "google_oauth_state";

// ============================================================
// Zodスキーマ定義
// ============================================================

const idTokenRequestSchema = z.object({
	idToken: z.string().min(1, "idTokenは必須です"),
	grantType: z.undefined().optional(),
});

const refreshTokenRequestSchema = z.object({
	grantType: z.literal("refresh_token"),
	refreshToken: z.string().min(1, "refreshTokenは必須です"),
});

const mobileTokenRequestSchema = z.union([
	idTokenRequestSchema,
	refreshTokenRequestSchema,
]);

const googleIdTokenPayloadSchema = z.object({
	iss: z.string(),
	aud: z.string(),
	exp: z.number(),
	email: z.string().email("無効なメールアドレスです"),
	name: z.string().optional(),
	picture: z.string().url().optional(),
});

// ============================================================
// 型定義
// ============================================================

interface UserRow {
	readonly id: string;
	readonly name: string | null;
	readonly email: string;
	readonly image: string | null;
}

interface RefreshTokenRow {
	readonly id: string;
	readonly user_id: string;
	readonly token_hash: string;
	readonly expires_at: string;
}

// ============================================================
// JWT関連ユーティリティ（Web Crypto API使用）
// ============================================================

function base64UrlEncode(data: Uint8Array): string {
	return btoa(String.fromCharCode(...data))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(
		base64.length + ((4 - (base64.length % 4)) % 4),
		"=",
	);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function createJwt(
	payload: Record<string, unknown>,
	secret: string,
): Promise<string> {
	const header = { alg: "HS256", typ: "JWT" };
	const encoder = new TextEncoder();

	const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
	const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
	const data = `${headerB64}.${payloadB64}`;

	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret).buffer as ArrayBuffer,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(data).buffer as ArrayBuffer,
	);
	const signatureB64 = base64UrlEncode(new Uint8Array(signature));

	return `${data}.${signatureB64}`;
}

// ============================================================
// Google JWKS（公開鍵）取得・キャッシュ
// ============================================================

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

const GOOGLE_ISSUERS = [
	"https://accounts.google.com",
	"accounts.google.com",
] as const;

const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

interface GoogleJwk {
	readonly kty: string;
	readonly kid: string;
	readonly alg: string;
	readonly n: string;
	readonly e: string;
	readonly use: string;
}

interface JwksResponse {
	readonly keys: readonly GoogleJwk[];
}

let jwksCache: { keys: Map<string, CryptoKey>; fetchedAt: number } | null =
	null;

async function getGooglePublicKeys(): Promise<Map<string, CryptoKey>> {
	const now = Date.now();
	if (jwksCache && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
		return jwksCache.keys;
	}

	const response = await fetch(GOOGLE_JWKS_URL);
	if (!response.ok) {
		throw new Error(`Google JWKS取得に失敗しました: HTTP ${response.status}`);
	}

	const jwks: JwksResponse = await response.json();
	const keys = new Map<string, CryptoKey>();

	for (const jwk of jwks.keys) {
		if (jwk.kty !== "RSA" || jwk.alg !== "RS256") continue;

		const cryptoKey = await crypto.subtle.importKey(
			"jwk",
			{ kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
			{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
			false,
			["verify"],
		);
		keys.set(jwk.kid, cryptoKey);
	}

	jwksCache = { keys, fetchedAt: now };
	return keys;
}

// ============================================================
// Google ID Token検証
// ============================================================

async function verifyGoogleIdToken(
	idToken: string,
	allowedClientIds: readonly string[],
): Promise<{ email: string; name: string; picture: string } | null> {
	try {
		const parts = idToken.split(".");
		if (parts.length !== 3) return null;

		const [headerB64, payloadB64, signatureB64] = parts;

		const header = JSON.parse(
			new TextDecoder().decode(base64UrlDecode(headerB64)),
		);
		const kid: unknown = header.kid;
		if (typeof kid !== "string" || !kid) return null;
		if (header.alg !== "RS256") return null;

		const publicKeys = await getGooglePublicKeys();
		let publicKey = publicKeys.get(kid);

		// kidに対応する鍵が見つからない場合、キャッシュクリアして再取得
		if (!publicKey) {
			jwksCache = null;
			const refreshedKeys = await getGooglePublicKeys();
			publicKey = refreshedKeys.get(kid);
			if (!publicKey) {
				console.error(`[auth] Google公開鍵が見つかりません: kid=${kid}`);
				return null;
			}
		}

		return verifyWithKey(
			publicKey,
			headerB64,
			payloadB64,
			signatureB64,
			allowedClientIds,
		);
	} catch {
		return null;
	}
}

async function verifyWithKey(
	publicKey: CryptoKey,
	headerB64: string,
	payloadB64: string,
	signatureB64: string,
	allowedClientIds: readonly string[],
): Promise<{ email: string; name: string; picture: string } | null> {
	const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
	const signature = base64UrlDecode(signatureB64);

	const isValid = await crypto.subtle.verify(
		{ name: "RSASSA-PKCS1-v1_5" },
		publicKey,
		signature.buffer as ArrayBuffer,
		signedData.buffer as ArrayBuffer,
	);

	if (!isValid) {
		console.error("[auth] ID Tokenの署名検証に失敗しました");
		return null;
	}

	const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
	const parsed = googleIdTokenPayloadSchema.safeParse(JSON.parse(payloadJson));
	if (!parsed.success) return null;

	const payload = parsed.data;

	if (
		!GOOGLE_ISSUERS.includes(payload.iss as (typeof GOOGLE_ISSUERS)[number])
	) {
		console.error(`[auth] iss不正: ${payload.iss}`);
		return null;
	}

	if (!allowedClientIds.includes(payload.aud)) {
		console.error(
			`[auth] aud不一致: 許可値=${allowedClientIds.join(",")}, 実際=${payload.aud}`,
		);
		return null;
	}

	const nowInSeconds = Math.floor(Date.now() / 1000);
	if (payload.exp < nowInSeconds) {
		console.error("[auth] ID Tokenの有効期限切れです");
		return null;
	}

	return {
		email: payload.email,
		name: payload.name ?? "",
		picture: payload.picture ?? "",
	};
}

// ============================================================
// ユーザー検索・作成
// ============================================================

async function findOrCreateUser(
	db: D1Database,
	email: string,
	name: string,
	image: string,
): Promise<UserRow> {
	const id = crypto.randomUUID();

	await db
		.prepare(
			"INSERT OR IGNORE INTO users (id, name, email, image) VALUES (?, ?, ?, ?)",
		)
		.bind(id, name, email, image)
		.run();

	const user = await db
		.prepare("SELECT * FROM users WHERE email = ?")
		.bind(email)
		.first<UserRow>();

	if (!user) {
		throw new Error(`ユーザーの作成に失敗しました: ${email}`);
	}

	return user;
}

// ============================================================
// リフレッシュトークン管理
// ============================================================

async function hashToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(token).buffer as ArrayBuffer,
	);
	return base64UrlEncode(new Uint8Array(digest));
}

function generateRefreshToken(): string {
	return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

async function saveRefreshToken(
	db: D1Database,
	userId: string,
	token: string,
	expiresInSeconds: number,
): Promise<void> {
	const id = crypto.randomUUID();
	const expiresAt = new Date(
		Date.now() + expiresInSeconds * 1000,
	).toISOString();
	const tokenHash = await hashToken(token);

	await db
		.prepare(
			"INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
		)
		.bind(id, userId, tokenHash, expiresAt)
		.run();
}

async function consumeRefreshToken(
	db: D1Database,
	token: string,
): Promise<UserRow | null> {
	const tokenHash = await hashToken(token);
	const row = await db
		.prepare(
			"SELECT rt.id, rt.user_id, rt.expires_at FROM refresh_tokens rt WHERE rt.token_hash = ?",
		)
		.bind(tokenHash)
		.first<RefreshTokenRow>();

	if (!row) return null;

	// 使用済みトークンを削除（ローテーション）
	await db
		.prepare("DELETE FROM refresh_tokens WHERE id = ?")
		.bind(row.id)
		.run();

	// 有効期限チェック
	if (new Date(row.expires_at) < new Date()) return null;

	const user = await db
		.prepare("SELECT * FROM users WHERE id = ?")
		.bind(row.user_id)
		.first<UserRow>();

	return user ?? null;
}

async function deleteRefreshTokensForUser(
	db: D1Database,
	userId: string,
): Promise<void> {
	await db
		.prepare("DELETE FROM refresh_tokens WHERE user_id = ?")
		.bind(userId)
		.run();
}

// ============================================================
// トークン発行共通関数
// ============================================================

async function issueTokens(
	db: D1Database,
	user: UserRow,
	jwtSecret: string,
): Promise<{
	token: string;
	refreshToken: string;
	expiresIn: number;
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
}> {
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		sub: user.id,
		email: user.email,
		name: user.name,
		iat: now,
		exp: now + ACCESS_TOKEN_EXPIRES_IN,
	};

	const token = await createJwt(payload, jwtSecret);
	const refreshTokenValue = generateRefreshToken();
	await saveRefreshToken(
		db,
		user.id,
		refreshTokenValue,
		REFRESH_TOKEN_EXPIRES_IN,
	);

	return {
		token,
		refreshToken: refreshTokenValue,
		expiresIn: ACCESS_TOKEN_EXPIRES_IN,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
		},
	};
}

// ============================================================
// OAuthConfig ヘルパー
// ============================================================

function getOAuthConfig(env: AppType["Bindings"]): OAuthConfig {
	const baseUrl =
		env.ENVIRONMENT === "production"
			? "https://miipa.app"
			: "http://localhost:8787";
	return {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		redirectUri: `${baseUrl}/auth/google/callback`,
	};
}

// ============================================================
// ルート定義
// ============================================================

export const auth = new Hono<AppType>();

/**
 * POST /auth/mobile/token
 *
 * Google ID Token → JWT発行 + リフレッシュトークン
 * リフレッシュトークン → 新JWT発行（ローテーション）
 */
auth.post("/mobile/token", async (c) => {
	try {
		const body = await c.req.json();
		const validation = mobileTokenRequestSchema.safeParse(body);

		if (!validation.success) {
			return c.json({ error: "リクエストが不正です" }, 400);
		}

		const db = c.env.DB;
		const jwtSecret = c.env.MOBILE_JWT_SECRET;

		if (!db) {
			console.error("[auth] D1データベースバインディングが見つかりません");
			return c.json({ error: "トークン生成に失敗しました" }, 500);
		}

		if (!jwtSecret) {
			console.error("[auth] 環境変数 MOBILE_JWT_SECRET が設定されていません");
			return c.json({ error: "トークン生成に失敗しました" }, 500);
		}

		const data = validation.data;

		// リフレッシュトークンによるJWT再発行
		if ("grantType" in data && data.grantType === "refresh_token") {
			const user = await consumeRefreshToken(db, data.refreshToken);
			if (!user) {
				return c.json({ error: "無効なリフレッシュトークンです" }, 401);
			}
			const result = await issueTokens(db, user, jwtSecret);
			return c.json(result);
		}

		// Google ID Tokenによる認証
		const googleClientId = c.env.GOOGLE_CLIENT_ID;
		if (!googleClientId) {
			console.error("[auth] 環境変数 GOOGLE_CLIENT_ID が設定されていません");
			return c.json({ error: "トークン生成に失敗しました" }, 500);
		}

		const allowedClientIds = [
			googleClientId,
			c.env.GOOGLE_IOS_CLIENT_ID,
		].filter((id): id is string => !!id);

		const googleUser = await verifyGoogleIdToken(
			data.idToken,
			allowedClientIds,
		);
		if (!googleUser) {
			return c.json({ error: "無効なGoogle IDトークンです" }, 401);
		}

		const user = await findOrCreateUser(
			db,
			googleUser.email,
			googleUser.name,
			googleUser.picture,
		);

		const result = await issueTokens(db, user, jwtSecret);
		return c.json(result);
	} catch (e) {
		console.error("[auth] トークン生成エラー:", e);
		return c.json({ error: "トークン生成に失敗しました" }, 500);
	}
});

/**
 * POST /auth/google
 *
 * Google OAuth認証URLを生成（PKCE対応）
 * レスポンス: { authUrl: string }
 * code_verifier と state は httpOnly Cookie に保存
 */
auth.post("/google", async (c) => {
	try {
		const config = getOAuthConfig(c.env);
		const body = await c.req.json().catch(() => ({}));
		const loginHint =
			typeof (body as Record<string, unknown>).loginHint === "string"
				? (body as Record<string, string>).loginHint
				: undefined;

		const result = await generateAuthUrl(config, loginHint);
		if (!isOk(result)) {
			return c.json({ error: result.error.message }, 500);
		}

		const { url, codeVerifier, state } = result.value;

		// code_verifier と state を httpOnly Cookie に保存
		setCookie(c, CODE_VERIFIER_COOKIE, codeVerifier, {
			httpOnly: true,
			secure: c.env.ENVIRONMENT === "production",
			sameSite: "Lax",
			maxAge: 600, // 10分
			path: "/",
		});

		setCookie(c, OAUTH_STATE_COOKIE, state, {
			httpOnly: true,
			secure: c.env.ENVIRONMENT === "production",
			sameSite: "Lax",
			maxAge: 600,
			path: "/",
		});

		return c.json({ authUrl: url });
	} catch (e) {
		console.error("[auth] OAuth URL生成エラー:", e);
		return c.json({ error: "認証URL生成に失敗しました" }, 500);
	}
});

/**
 * GET /auth/google/callback
 *
 * Google OAuth コールバック
 * code交換 → JWT発行 → Set-Cookie → フロントエンドにリダイレクト
 */
auth.get("/google/callback", async (c) => {
	const baseUrl =
		c.env.ENVIRONMENT === "production"
			? "https://miipa.app"
			: "http://localhost:8081";

	try {
		const code = c.req.query("code");
		const state = c.req.query("state");
		const error = c.req.query("error");

		if (error) {
			const errorDescription =
				c.req.query("error_description") || "認証がキャンセルされました";
			return c.redirect(
				`${baseUrl}/settings/calendars?calendar=error&message=${encodeURIComponent(errorDescription)}`,
			);
		}

		if (!code) {
			return c.redirect(
				`${baseUrl}/settings/calendars?calendar=error&message=${encodeURIComponent("認証コードが見つかりません")}`,
			);
		}

		// Cookie から code_verifier と state を取得
		const codeVerifier = getCookie(c, CODE_VERIFIER_COOKIE);
		const savedState = getCookie(c, OAUTH_STATE_COOKIE);

		if (!codeVerifier) {
			return c.redirect(
				`${baseUrl}/settings/calendars?calendar=error&message=${encodeURIComponent("認証セッションが無効です。もう一度お試しください。")}`,
			);
		}

		// state検証（CSRF対策）
		if (state && savedState && state !== savedState) {
			return c.redirect(
				`${baseUrl}/settings/calendars?calendar=error&message=${encodeURIComponent("認証セッションが無効です。もう一度お試しください。")}`,
			);
		}

		// コードをトークンに交換
		const config = getOAuthConfig(c.env);
		const tokenResult = await exchangeCode(config, code, codeVerifier);

		if (!isOk(tokenResult)) {
			console.error(
				"[auth] Google OAuthトークン交換エラー:",
				tokenResult.error,
			);
			return c.redirect(
				`${baseUrl}/settings/calendars?calendar=error&message=${encodeURIComponent(tokenResult.error.message)}`,
			);
		}

		// TODO: tokenResult.value（accessToken, refreshToken）を使って
		// ユーザー情報取得 → findOrCreateUser → JWT発行
		// 現時点ではカレンダー連携のコールバックとして成功リダイレクト

		// code_verifier, state Cookie を削除
		deleteCookie(c, CODE_VERIFIER_COOKIE, { path: "/" });
		deleteCookie(c, OAUTH_STATE_COOKIE, { path: "/" });

		return c.redirect(`${baseUrl}/settings/calendars?calendar=success`);
	} catch (e) {
		console.error("[auth] Google OAuthコールバックエラー:", e);
		return c.redirect(
			`${baseUrl}/settings/calendars?calendar=error&message=${encodeURIComponent("予期しないエラーが発生しました")}`,
		);
	}
});

/**
 * POST /auth/refresh
 *
 * リフレッシュトークン → 新JWT発行（Cookie版）
 * BodyまたはCookieからリフレッシュトークンを取得
 */
auth.post("/refresh", async (c) => {
	try {
		const db = c.env.DB;
		const jwtSecret = c.env.MOBILE_JWT_SECRET;

		if (!db || !jwtSecret) {
			return c.json({ error: "サーバー設定エラー" }, 500);
		}

		// Body からリフレッシュトークンを取得
		let refreshTokenValue: string | undefined;

		const body = await c.req.json().catch(() => ({}));
		if (typeof (body as Record<string, unknown>).refreshToken === "string") {
			refreshTokenValue = (body as Record<string, string>).refreshToken;
		}

		// Cookie フォールバック
		if (!refreshTokenValue) {
			refreshTokenValue = getCookie(c, REFRESH_TOKEN_COOKIE_NAME) ?? undefined;
		}

		if (!refreshTokenValue) {
			return c.json({ error: "リフレッシュトークンが必要です" }, 400);
		}

		const user = await consumeRefreshToken(db, refreshTokenValue);
		if (!user) {
			return c.json({ error: "無効なリフレッシュトークンです" }, 401);
		}

		const result = await issueTokens(db, user, jwtSecret);

		// Cookie にもセット（Web用）
		setCookie(c, JWT_COOKIE_NAME, result.token, {
			httpOnly: true,
			secure: c.env.ENVIRONMENT === "production",
			sameSite: "Lax",
			maxAge: ACCESS_TOKEN_EXPIRES_IN,
			path: "/",
		});

		setCookie(c, REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
			httpOnly: true,
			secure: c.env.ENVIRONMENT === "production",
			sameSite: "Lax",
			maxAge: REFRESH_TOKEN_EXPIRES_IN,
			path: "/",
		});

		return c.json(result);
	} catch (e) {
		console.error("[auth] リフレッシュエラー:", e);
		return c.json({ error: "トークン更新に失敗しました" }, 500);
	}
});

/**
 * POST /auth/logout
 *
 * Cookie削除 + リフレッシュトークン無効化
 */
auth.post("/logout", async (c) => {
	try {
		const db = c.env.DB;
		const jwtSecret = c.env.MOBILE_JWT_SECRET;

		// JWTからユーザーIDを取得（認証済みの場合）
		if (db && jwtSecret) {
			const authHeader = c.req.header("authorization");
			let token: string | null = null;
			if (authHeader?.startsWith("Bearer ")) {
				token = authHeader.slice(7);
			}
			if (!token) {
				token = getCookie(c, JWT_COOKIE_NAME) ?? null;
			}

			if (token) {
				const payload = await verifyJwt(token, jwtSecret);
				if (payload) {
					// ユーザーの全リフレッシュトークンを削除
					await deleteRefreshTokensForUser(db, payload.sub);
				}
			}
		}

		// Cookie を削除
		deleteCookie(c, JWT_COOKIE_NAME, { path: "/" });
		deleteCookie(c, REFRESH_TOKEN_COOKIE_NAME, { path: "/" });

		return c.json({ success: true });
	} catch (e) {
		console.error("[auth] ログアウトエラー:", e);
		// Cookie削除は試行する
		deleteCookie(c, JWT_COOKIE_NAME, { path: "/" });
		deleteCookie(c, REFRESH_TOKEN_COOKIE_NAME, { path: "/" });
		return c.json({ success: true });
	}
});
