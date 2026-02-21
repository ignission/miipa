/**
 * PKCE セッションストア
 *
 * OAuth PKCE フローの code_verifier を D1 データベースで管理します。
 * Cloudflare Workers は複数インスタンスで動作するため、
 * インメモリではなく D1 に永続化してセッションの一貫性を保証します。
 *
 * @module lib/auth/pkce-session-store
 */

/** PKCE セッションの有効期限（秒）: 10分 */
const PKCE_SESSION_TTL_SEC = 10 * 60;

/**
 * PKCEセッションを D1 に保存
 *
 * @param db - D1 Database インスタンス
 * @param state - OAuth state パラメータ（キー）
 * @param codeVerifier - PKCE code_verifier
 */
export async function savePkceSession(
	db: D1Database,
	state: string,
	codeVerifier: string,
): Promise<void> {
	const expiresAt = Math.floor(Date.now() / 1000) + PKCE_SESSION_TTL_SEC;

	// 期限切れエントリを削除してからINSERT
	await db
		.prepare("DELETE FROM pkce_sessions WHERE expires_at < ?")
		.bind(Math.floor(Date.now() / 1000))
		.run();

	await db
		.prepare(
			"INSERT OR REPLACE INTO pkce_sessions (state, code_verifier, expires_at) VALUES (?, ?, ?)",
		)
		.bind(state, codeVerifier, expiresAt)
		.run();
}

/**
 * PKCEセッションを取得して削除（ワンタイム使用）
 *
 * @param db - D1 Database インスタンス
 * @param state - OAuth state パラメータ（キー）
 * @returns code_verifier、または見つからない/期限切れの場合 null
 */
export async function consumePkceSession(
	db: D1Database,
	state: string,
): Promise<string | null> {
	const row = await db
		.prepare(
			"SELECT code_verifier, expires_at FROM pkce_sessions WHERE state = ?",
		)
		.bind(state)
		.first<{ code_verifier: string; expires_at: number }>();

	if (!row) {
		return null;
	}

	// 使用済みセッションを即座に削除（リプレイ攻撃防止）
	await db
		.prepare("DELETE FROM pkce_sessions WHERE state = ?")
		.bind(state)
		.run();

	if (row.expires_at < Math.floor(Date.now() / 1000)) {
		return null;
	}

	return row.code_verifier;
}
