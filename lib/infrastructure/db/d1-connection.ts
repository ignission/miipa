/**
 * D1データベースコネクション管理モジュール
 *
 * Cloudflare D1データベースへのアクセスを提供する薄いラッパーです。
 * マイグレーションは `wrangler d1 migrations apply` で手動実行します。
 *
 * @module lib/infrastructure/db/d1-connection
 *
 * @example
 * ```typescript
 * import { getD1Connection } from '@/lib/infrastructure/db/d1-connection';
 * import { isOk } from '@/lib/domain/shared';
 *
 * const result = getD1Connection();
 * if (isOk(result)) {
 *   const db = result.value;
 *   const stmt = db.prepare('SELECT * FROM users');
 *   const rows = await stmt.all();
 * }
 * ```
 */

import type { Result } from "@/lib/domain/shared/result";
import { getD1Database } from "@/lib/infrastructure/cloudflare/bindings";
import type { DatabaseError } from "@/lib/infrastructure/db/types";

// ============================================================
// 公開API
// ============================================================

/**
 * D1データベース接続を取得
 *
 * Cloudflare環境からD1データベースバインディングを取得します。
 * 自動マイグレーション機能はありません（wrangler d1 migrations applyで手動実行）。
 *
 * @returns 成功時はD1Database、失敗時はDatabaseError
 */
export function getD1Connection(): Result<D1Database, DatabaseError> {
	return getD1Database();
}
