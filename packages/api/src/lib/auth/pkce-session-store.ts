/**
 * PKCE セッションストア
 *
 * OAuth PKCE フローの code_verifier をインメモリで管理します。
 * Cookie はモバイルの外部ブラウザで共有できないため、
 * Workerインスタンス内のMapで管理します。
 *
 * @module lib/auth/pkce-session-store
 */

interface PkceSessionEntry {
	readonly codeVerifier: string;
	readonly expiresAt: number;
}

/** PKCE セッションの一時保存用Map（10分TTL、stateをキーとして使用） */
const pkceSessionStore = new Map<string, PkceSessionEntry>();

/** PKCE セッションの有効期限（ミリ秒）: 10分 */
const PKCE_SESSION_TTL_MS = 10 * 60 * 1000;

/**
 * 期限切れのPKCEセッションをクリーンアップ
 */
function cleanupExpiredSessions(): void {
	const now = Date.now();
	for (const [state, entry] of pkceSessionStore) {
		if (entry.expiresAt < now) {
			pkceSessionStore.delete(state);
		}
	}
}

/**
 * PKCEセッションを保存
 *
 * @param state - OAuth state パラメータ（キー）
 * @param codeVerifier - PKCE code_verifier
 */
export function savePkceSession(state: string, codeVerifier: string): void {
	cleanupExpiredSessions();
	pkceSessionStore.set(state, {
		codeVerifier,
		expiresAt: Date.now() + PKCE_SESSION_TTL_MS,
	});
}

/**
 * PKCEセッションを取得して削除（ワンタイム使用）
 *
 * @param state - OAuth state パラメータ（キー）
 * @returns code_verifier、または見つからない/期限切れの場合 null
 */
export function consumePkceSession(state: string): string | null {
	const entry = pkceSessionStore.get(state);
	if (!entry) {
		return null;
	}

	// 使用済みセッションを即座に削除（リプレイ攻撃防止）
	pkceSessionStore.delete(state);

	if (entry.expiresAt < Date.now()) {
		return null;
	}

	return entry.codeVerifier;
}
