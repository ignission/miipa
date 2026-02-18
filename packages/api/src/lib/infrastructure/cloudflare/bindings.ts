/**
 * Cloudflareバインディングヘルパーモジュール（Hono版）
 *
 * Hono環境では c.env から直接バインディングを取得するため、
 * getCloudflareContext() は使用しません。
 * 引数でDB等を受け取り、そのまま返すパススルー関数を提供します。
 *
 * @module packages/api/src/lib/infrastructure/cloudflare/bindings
 */

/** D1データベースを取得（Honoコンテキストから渡される） */
export function getD1Database(db: D1Database): D1Database {
	return db;
}

/** 暗号化キーを取得（Honoコンテキストから渡される） */
export function getEncryptionKey(key: string): string {
	return key;
}
