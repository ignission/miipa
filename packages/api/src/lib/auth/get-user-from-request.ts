/**
 * リクエストからユーザー情報を取得するヘルパー（Hono版）
 *
 * Auth.js依存を排除し、JWTベースの認証のみ使用します。
 * Bearerトークン（Authorization ヘッダ）および Cookie からJWTを取得します。
 */

import { JWT_COOKIE_NAME } from "./constants";
import { extractBearerToken, verifyMobileJwt } from "./mobile-jwt";

/**
 * Cookie文字列から指定されたCookieの値を取得
 */
function getCookieValue(
	cookieHeader: string | null,
	name: string,
): string | null {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

/**
 * BearerトークンまたはCookieからユーザーIDを取得
 *
 * 1. Authorization: Bearer <token> からJWTを取得
 * 2. Cookie (miipa_token) からJWTを取得（Web用フォールバック）
 * 3. JWT検証成功 → ユーザー情報を返す
 */
export async function getUserFromRequest(
	request: Request,
	jwtSecret: string,
): Promise<{ id: string; email?: string; name?: string } | null> {
	// 1. Bearerトークンを試行
	const authHeader = request.headers.get("authorization");
	let token = extractBearerToken(authHeader);

	// 2. Cookie フォールバック（Web用）
	if (!token) {
		const cookieHeader = request.headers.get("cookie");
		token = getCookieValue(cookieHeader, JWT_COOKIE_NAME);
	}

	if (!token) return null;

	// 3. JWT検証
	const payload = await verifyMobileJwt(token, jwtSecret);
	if (!payload) return null;

	return {
		id: payload.sub,
		email: payload.email,
		name: payload.name,
	};
}
