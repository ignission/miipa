/**
 * CORSミドルウェア
 *
 * 許可するオリジン、メソッド、ヘッダを設定します。
 *
 * @module packages/api/src/middleware/cors
 */

import { cors } from "hono/cors";

export const corsMiddleware = cors({
	origin: [
		"https://miipa.app",
		"http://localhost:8081",
		"http://localhost:3000",
	],
	credentials: true,
	allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowHeaders: ["Content-Type", "Authorization"],
	exposeHeaders: ["Content-Length"],
	maxAge: 86400,
});
