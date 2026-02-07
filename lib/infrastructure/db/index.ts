/**
 * データベースモジュール
 *
 * miipaアプリケーションのデータ永続化基盤を提供します。
 * Cloudflare D1を使用した非同期APIにより、エッジ環境で動作します。
 *
 * ## 提供する機能
 *
 * ### D1接続管理
 * - getD1Connection: D1データベース接続の取得
 *
 * ### リポジトリ
 * - D1EventRepository: D1ベースのイベントリポジトリ
 *
 * ### 型定義
 * - DatabaseError: エラー型
 *
 * @module lib/infrastructure/db
 *
 * @example
 * ```typescript
 * import { getD1Connection, D1EventRepository } from '@/lib/infrastructure/db';
 * import { isOk } from '@/lib/domain/shared';
 *
 * const result = getD1Connection();
 * if (isOk(result)) {
 *   const db = result.value;
 *   const stmt = db.prepare('SELECT * FROM events');
 *   const rows = await stmt.all();
 * }
 * ```
 */

// ============================================================
// D1接続管理
// ============================================================

export { getD1Connection } from "./d1-connection";

// ============================================================
// 型定義
// ============================================================

export type {
	/** データベース接続設定 */
	DatabaseConfig,
	/** データベース接続オブジェクト型 */
	DatabaseConnection,
	/** データベースエラー */
	DatabaseError,
	/** データベースエラーコード */
	DatabaseErrorCode,
	/** マイグレーションファイル情報 */
	MigrationFile,
	/** マイグレーション情報 */
	MigrationInfo,
	/** 設定値の行データ */
	SettingRow,
} from "./types";

export {
	/** データベースクローズエラーを生成 */
	databaseCloseError,
	/** マイグレーションエラーを生成 */
	databaseMigrationError,
	/** データベース未初期化エラーを生成 */
	databaseNotInitializedError,
	// エラーファクトリ
	/** データベースオープンエラーを生成 */
	databaseOpenError,
	/** クエリエラーを生成 */
	databaseQueryError,
	// 型ガード
	/** DatabaseErrorかどうかを判定 */
	isDatabaseError,
} from "./types";

// ============================================================
// リポジトリ
// ============================================================

export { D1EventRepository } from "./d1-event-repository";
