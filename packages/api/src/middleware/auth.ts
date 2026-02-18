/**
 * JWT認証ミドルウェア
 *
 * Authorization: Bearer <token> または Cookie (miipa_token) からJWTを取得し、
 * Web Crypto API (HMAC SHA-256) で検証します。
 *
 * @module packages/api/src/middleware/auth
 */

import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppType } from "@/context/app-context";
import { JWT_COOKIE_NAME } from "@/lib/auth/constants";
import { base64UrlDecode } from "@/lib/utils/base64url";

/** JWTペイロード型 */
interface JwtPayload {
	sub: string;
	email: string;
	name: string;
	iat: number;
	exp: number;
}

/**
 * JWTトークンを検証してペイロードを返す
 *
 * Web Crypto API の HMAC SHA-256 で署名を検証し、
 * 有効期限と必須フィールドをチェックします。
 *
 * @param token - JWT文字列
 * @param secret - HMAC署名用シークレット
 * @returns 検証済みペイロード、または null
 */
export async function verifyJwt(
	token: string,
	secret: string,
): Promise<JwtPayload | null> {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;

		const [headerB64, payloadB64, signatureB64] = parts;

		// alg ヘッダー検証（CVE-2015-9235 対策: "none" や不正アルゴリズムを拒否）
		const header = JSON.parse(
			new TextDecoder().decode(base64UrlDecode(headerB64)),
		) as Record<string, unknown>;
		if (header.alg !== "HS256") return null;

		const data = `${headerB64}.${payloadB64}`;
		const encoder = new TextEncoder();

		// HMAC鍵をインポート
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret).buffer as ArrayBuffer,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"],
		);

		// 署名検証
		const signature = base64UrlDecode(signatureB64);
		const isValid = await crypto.subtle.verify(
			"HMAC",
			key,
			signature.buffer as ArrayBuffer,
			encoder.encode(data).buffer as ArrayBuffer,
		);

		if (!isValid) return null;

		// ペイロードデコード
		const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
		const payload = JSON.parse(payloadJson) as Record<string, unknown>;

		// 必須フィールドの検証
		if (typeof payload.sub !== "string" || payload.sub.length === 0)
			return null;
		if (typeof payload.exp !== "number") return null;

		// 有効期限チェック
		if (payload.exp < Date.now() / 1000) return null;

		return payload as unknown as JwtPayload;
	} catch {
		return null;
	}
}

/**
 * Bearerトークンを抽出
 */
function extractBearerToken(authHeader: string | null): string | null {
	if (!authHeader?.startsWith("Bearer ")) return null;
	return authHeader.slice(7);
}

/**
 * JWT認証ミドルウェア
 *
 * 以下の順序でJWTを取得:
 * 1. Authorization: Bearer <token> ヘッダ
 * 2. Cookie (miipa_token)（Web用）
 *
 * 検証成功時はコンテキスト変数に userId, db, encryptionKey をセットします。
 * 検証失敗時は 401 Unauthorized を返します。
 */
export const authMiddleware: MiddlewareHandler<AppType> = async (c, next) => {
	const jwtSecret = c.env.MOBILE_JWT_SECRET;
	if (!jwtSecret) {
		console.error("[auth] MOBILE_JWT_SECRET が設定されていません");
		return c.json({ error: "サーバー設定エラー" }, 500);
	}

	// 1. Authorization ヘッダからBearerトークンを取得
	let token = extractBearerToken(c.req.header("authorization") ?? null);

	// 2. Cookie フォールバック（Web用）
	if (!token) {
		token = getCookie(c, JWT_COOKIE_NAME) ?? null;
	}

	if (!token) {
		return c.json({ error: "認証が必要です" }, 401);
	}

	// 3. JWT検証
	const payload = await verifyJwt(token, jwtSecret);
	if (!payload) {
		return c.json({ error: "無効なトークンです" }, 401);
	}

	// 4. コンテキスト変数にセット
	c.set("userId", payload.sub);
	c.set("db", c.env.DB);
	c.set("encryptionKey", c.env.ENCRYPTION_KEY);

	await next();
};
