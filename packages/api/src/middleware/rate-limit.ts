/**
 * インメモリレートリミッター
 *
 * Cloudflare Workers環境では完全な分散レートリミットは困難なため、
 * インスタンス単位での簡易的なレートリミットを実装。
 * 本格的な対策にはCloudflare Rate Limitingの利用を推奨。
 *
 * @module packages/api/src/middleware/rate-limit
 */

import type { Context, MiddlewareHandler } from "hono";

/** レートリミットエントリ */
interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/** インメモリストア */
const store = new Map<string, RateLimitEntry>();

/** 期限切れエントリの定期クリーンアップ（100リクエストごと） */
let requestCount = 0;
function cleanupExpired(): void {
	requestCount++;
	if (requestCount % 100 !== 0) return;
	const now = Date.now();
	for (const [key, entry] of store) {
		if (entry.resetAt <= now) {
			store.delete(key);
		}
	}
}

/** レートリミット設定 */
interface RateLimitOptions {
	/** ウィンドウ期間（ミリ秒） */
	windowMs: number;
	/** ウィンドウ期間内の最大リクエスト数 */
	limit: number;
	/** レートリミットキーを生成する関数 */
	keyGenerator?: (c: Context) => string;
}

/**
 * レートリミットミドルウェアを生成
 *
 * 指定されたウィンドウ期間内のリクエスト数を制限します。
 * 制限超過時は HTTP 429 Too Many Requests を返します。
 *
 * @param options - レートリミット設定
 * @returns Honoミドルウェアハンドラ
 */
export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
	const { windowMs, limit, keyGenerator } = options;

	return async (c, next) => {
		cleanupExpired();

		const key = keyGenerator
			? keyGenerator(c)
			: `${c.req.method}:${c.req.path}`;
		const now = Date.now();
		const entry = store.get(key);

		if (entry && entry.resetAt > now) {
			if (entry.count >= limit) {
				c.header(
					"Retry-After",
					String(Math.ceil((entry.resetAt - now) / 1000)),
				);
				return c.json(
					{
						error:
							"リクエスト数が制限を超えました。しばらく待ってから再試行してください。",
					},
					429,
				);
			}
			entry.count++;
		} else {
			store.set(key, { count: 1, resetAt: now + windowMs });
		}

		await next();
	};
}
