/**
 * モバイルアプリ用JWT検証ヘルパー
 */

interface JwtPayload {
	sub: string;
	email: string;
	name: string;
	iat: number;
	exp: number;
}

/**
 * Base64URL デコード
 */
function base64UrlDecode(str: string): Uint8Array {
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(padded);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
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
