/**
 * CORSミドルウェア
 *
 * 許可するオリジン、メソッド、ヘッダを設定します。
 *
 * @module packages/api/src/middleware/cors
 */

import { cors } from "hono/cors";

const PRODUCTION_ORIGINS = ["https://miipa.app"];
const DEV_ORIGINS = [
	"https://miipa.app",
	"http://localhost:8081",
	"http://localhost:3000",
];

export const corsMiddleware = cors({
	origin: (origin, c) => {
		const env = c.env as { ENVIRONMENT?: string };
		const allowedOrigins =
			env.ENVIRONMENT === "production" ? PRODUCTION_ORIGINS : DEV_ORIGINS;
		return allowedOrigins.includes(origin) ? origin : "";
	},
	credentials: true,
	allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowHeaders: ["Content-Type", "Authorization"],
	exposeHeaders: ["Content-Length"],
	maxAge: 86400,
});
