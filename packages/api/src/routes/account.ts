/**
 * アカウント管理 Hono ルート
 *
 * ユーザーアカウントと関連データの削除を提供します。
 * Google OAuthトークンの失効も行います。
 *
 * 対応元: app/api/account/route.ts → DELETE /account
 */

import { Hono } from "hono";
import type { AppType } from "@/context/app-context";

// ============================================================
// ヘルパー
// ============================================================

/**
 * Google OAuthトークンを失効させる
 *
 * @param token - 失効対象のアクセストークン
 */
async function revokeGoogleToken(token: string): Promise<void> {
	const response = await fetch(
		`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
		},
	);
	if (!response.ok) {
		throw new Error(`トークン失効失敗: ${response.status}`);
	}
}

// ============================================================
// ルート定義
// ============================================================

const account = new Hono<AppType>();

/**
 * DELETE /account - アカウント削除
 *
 * 処理順序:
 * 1. Google OAuthトークン失効（失敗してもログのみで続行）
 * 2. D1から関連データを順次削除（usersはCASCADEで関連テーブルも削除）
 */
account.delete("/", async (c) => {
	const db = c.get("db") as D1Database;
	const userId = c.get("userId") as string;

	try {
		// Google OAuthトークン失効
		try {
			const accountRecord = await db
				.prepare(
					"SELECT access_token FROM accounts WHERE userId = ? AND provider = 'google'",
				)
				.bind(userId)
				.first<{ access_token: string }>();

			if (accountRecord?.access_token) {
				await revokeGoogleToken(accountRecord.access_token);
			}
		} catch (e) {
			// トークン失効失敗はログのみで削除処理を続行
			console.warn("[account] Google OAuthトークン失効失敗:", e);
		}

		// 関連データを順次削除
		await db
			.prepare("DELETE FROM sessions WHERE userId = ?")
			.bind(userId)
			.run();
		await db
			.prepare("DELETE FROM accounts WHERE userId = ?")
			.bind(userId)
			.run();
		// users テーブル削除（CASCADE で user_settings, calendars, calendar_events, calendar_sync_state, credentials も削除）
		await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

		return c.json({ success: true });
	} catch (e) {
		console.error("[account] アカウント削除失敗:", e);
		return c.json({ error: "アカウントの削除に失敗しました" }, 500);
	}
});

export { account };
