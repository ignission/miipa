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
import { corsMiddleware } from "@/middleware/cors";
import { errorHandler } from "@/middleware/error-handler";
import { auth } from "@/routes/auth";

const app = new Hono<AppType>();

// グローバルミドルウェア
app.use("/*", corsMiddleware);
app.onError(errorHandler);

// ヘルスチェック
app.get("/health", (c) => c.json({ status: "ok" }));

// ルート
app.route("/auth", auth);

// 他のルートは後続タスクで追加
// app.route("/calendars", calendars);
// app.route("/events", events);
// app.route("/chat", chat);
// app.route("/settings", settings);
// app.route("/setup", setup);
// app.route("/account", account);

export default app;
