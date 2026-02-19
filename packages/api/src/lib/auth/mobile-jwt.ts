/**
 * モバイルアプリ用JWT検証ヘルパー
 */

import { base64UrlDecode } from "@/lib/utils/base64url";

interface JwtPayload {
	sub: string;
	email: string;
	name: string;
	iat: number;
	exp: number;
}

/**
 * JWTトークンを検証してペイロードを返す
 * 無効な場合はnullを返す
 */
export async function verifyMobileJwt(
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

		// 署名検証
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret).buffer as ArrayBuffer,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["verify"],
		);

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

		// ペイロードの必須フィールドを検証
		if (typeof payload.sub !== "string" || payload.sub.length === 0)
			return null;
		if (typeof payload.email !== "string" || payload.email.length === 0)
			return null;
		if (typeof payload.name !== "string") return null;
		if (typeof payload.exp !== "number") return null;

		// 有効期限チェック
		if (payload.exp < Date.now() / 1000) return null;

		return payload as unknown as JwtPayload;
	} catch {
		return null;
	}
}

/**
 * リクエストヘッダからBearerトークンを抽出
 */
export function extractBearerToken(authHeader: string | null): string | null {
	if (!authHeader?.startsWith("Bearer ")) return null;
	return authHeader.slice(7);
}
