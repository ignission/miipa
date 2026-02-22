/**
 * miipa API エントリーポイント
 *
 * Hono on Cloudflare Workers で動作する REST API サーバー。
 * JWT認証、Google OAuth、カレンダー統合を提供します。
 *
 * @module packages/api/src/index
 */

import { Hono } from "hono";
import type { AppType } from "@/context/app-context";
import { authMiddleware } from "@/middleware/auth";
import { corsMiddleware } from "@/middleware/cors";
import { errorHandler } from "@/middleware/error-handler";
import { rateLimiter } from "@/middleware/rate-limit";
import { securityHeaders } from "@/middleware/security-headers";
import { account } from "@/routes/account";
import { auth } from "@/routes/auth";
import { calendars } from "@/routes/calendars";
import { chat } from "@/routes/chat";
import { events } from "@/routes/events";
import { settings } from "@/routes/settings";
import { setup } from "@/routes/setup";

const app = new Hono<AppType>();

// グローバルミドルウェア
app.use("/*", corsMiddleware);
app.use("/*", securityHeaders);
app.onError(errorHandler);

// レートリミット: 認証ルート（IPベース）
app.use(
	"/auth/mobile/token",
	rateLimiter({
		windowMs: 60 * 1000,
		limit: 10,
		keyGenerator: (c) =>
			`auth-mobile:${c.req.header("cf-connecting-ip") || "unknown"}`,
	}),
);
app.use(
	"/auth/refresh",
	rateLimiter({
		windowMs: 60 * 1000,
		limit: 30,
		keyGenerator: (c) =>
			`auth-refresh:${c.req.header("cf-connecting-ip") || "unknown"}`,
	}),
);

// ヘルスチェック（認証不要）
app.get("/health", (c) => c.json({ status: "ok" }));

// 認証ルート（認証不要）
app.route("/auth", auth);

// 認証が必要なルートグループ
const protectedApp = new Hono<AppType>();
protectedApp.use("/*", authMiddleware);

// レートリミット: 認証済みルート（userIdベース）
protectedApp.use(
	"/chat",
	rateLimiter({
		windowMs: 60 * 1000,
		limit: 20,
		keyGenerator: (c) => `chat:${c.get("userId")}`,
	}),
);
protectedApp.use(
	"/calendars/ical",
	rateLimiter({
		windowMs: 60 * 1000,
		limit: 10,
		keyGenerator: (c) => `calendars-ical:${c.get("userId")}`,
	}),
);
protectedApp.use(
	"/setup/validate-key",
	rateLimiter({
		windowMs: 60 * 1000,
		limit: 10,
		keyGenerator: (c) => `setup-validate:${c.get("userId")}`,
	}),
);

protectedApp.route("/calendars", calendars);
protectedApp.route("/events", events);
protectedApp.route("/chat", chat);
protectedApp.route("/settings", settings);
protectedApp.route("/setup", setup);
protectedApp.route("/account", account);
app.route("/", protectedApp);

export default app;
