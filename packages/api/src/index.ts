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
app.onError(errorHandler);

// ヘルスチェック（認証不要）
app.get("/health", (c) => c.json({ status: "ok" }));

// 認証ルート（認証不要）
app.route("/auth", auth);

// 認証が必要なルートグループ
const protectedApp = new Hono<AppType>();
protectedApp.use("/*", authMiddleware);
protectedApp.route("/calendars", calendars);
protectedApp.route("/events", events);
protectedApp.route("/chat", chat);
protectedApp.route("/settings", settings);
protectedApp.route("/setup", setup);
protectedApp.route("/account", account);
app.route("/", protectedApp);

export default app;
