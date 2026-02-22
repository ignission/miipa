/**
 * セキュリティヘッダーミドルウェア
 *
 * 一般的なセキュリティヘッダーを全レスポンスに追加します。
 *
 * @module packages/api/src/middleware/security-headers
 */

import type { MiddlewareHandler } from "hono";

/**
 * セキュリティヘッダーミドルウェア
 *
 * 以下のヘッダーをレスポンスに付与:
 * - X-Content-Type-Options: MIMEスニッフィング防止
 * - X-Frame-Options: クリックジャッキング防止
 * - Strict-Transport-Security: HTTPS強制
 * - Referrer-Policy: リファラー制御
 * - X-DNS-Prefetch-Control: DNSプリフェッチ無効化
 * - Permissions-Policy: ブラウザ機能の制限
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
	await next();
	c.header("X-Content-Type-Options", "nosniff");
	c.header("X-Frame-Options", "DENY");
	c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
	c.header("Referrer-Policy", "strict-origin-when-cross-origin");
	c.header("X-DNS-Prefetch-Control", "off");
	c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
};
