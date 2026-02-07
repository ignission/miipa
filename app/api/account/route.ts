/**
 * アカウント削除 API エンドポイント
 *
 * ユーザーアカウントと関連データをすべて削除します。
 * Google OAuthトークンの失効も行います。
 *
 * @endpoint DELETE /api/account
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/account', { method: 'DELETE' });
 *
 * // 成功レスポンス (200)
 * // { success: true }
 *
 * // 未認証 (401)
 * // { error: "認証が必要です" }
 *
 * // サーバーエラー (500)
 * // { error: "アカウントの削除に失敗しました" }
 * ```
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isOk } from "@/lib/domain/shared/result";
import { getD1Database } from "@/lib/infrastructure/cloudflare/bindings";

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

/**
 * アカウントを削除する
 *
 * 処理順序:
 * 1. 認証チェック
 * 2. Google OAuthトークン失効（失敗してもログのみで続行）
 * 3. D1から関連データを順次削除（usersはCASCADEで関連テーブルも削除）
 *
 * @returns 削除結果
 */
export async function DELETE(): Promise<NextResponse> {
	// 認証チェック
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
	}

	const userId = session.user.id;

	// D1データベース取得
	const dbResult = getD1Database();
	if (!isOk(dbResult)) {
		return NextResponse.json(
			{ error: "アカウントの削除に失敗しました" },
			{ status: 500 },
		);
	}
	const db = dbResult.value;

	try {
		// Google OAuthトークン失効
		try {
			const account = await db
				.prepare(
					"SELECT access_token FROM accounts WHERE userId = ? AND provider = 'google'",
				)
				.bind(userId)
				.first<{ access_token: string }>();

			if (account?.access_token) {
				await revokeGoogleToken(account.access_token);
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
		// usersテーブル削除（CASCADEで user_settings, calendars, calendar_events, calendar_sync_state, credentials も削除）
		await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();

		return NextResponse.json({ success: true });
	} catch (e) {
		console.error("[account] アカウント削除失敗:", e);
		return NextResponse.json(
			{ error: "アカウントの削除に失敗しました" },
			{ status: 500 },
		);
	}
}
