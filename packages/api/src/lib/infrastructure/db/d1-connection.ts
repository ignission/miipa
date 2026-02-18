/**
 * D1データベースコネクション管理モジュール（Hono版）
 *
 * Hono環境では c.env.DB から直接D1データベースを取得するため、
 * このモジュールは引数でDBを受け取るパススルー関数を提供します。
 *
 * @module packages/api/src/lib/infrastructure/db/d1-connection
 */

// ============================================================
// 公開API
// ============================================================

/**
 * D1データベース接続を取得
 *
 * Honoのc.env.DBから渡されたD1データベースをそのまま返します。
 *
 * @param db - D1データベース（Honoのc.envから取得）
 * @returns D1Database
 */
export function getD1Connection(db: D1Database): D1Database {
	return db;
}
