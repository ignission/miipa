/**
 * グローバルエラーハンドラ
 *
 * キャッチされなかった例外をハンドリングし、
 * 統一的なエラーレスポンスを返します。
 *
 * @module packages/api/src/middleware/error-handler
 */

import type { ErrorHandler } from "hono";
import type { AppType } from "@/context/app-context";

export const errorHandler: ErrorHandler<AppType> = (err, c) => {
	console.error("[API Error]", err);
	return c.json({ error: "サーバーエラーが発生しました" }, 500);
};
