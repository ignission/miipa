/**
 * SQLiteデータベースモジュール
 *
 * SoloDayアプリケーションのデータ永続化基盤を提供します。
 * better-sqlite3を使用した同期APIにより、シンプルで高速なデータベース操作を実現します。
 *
 * ## 提供する機能
 *
 * ### 接続管理
 * - initializeDatabase: データベースの初期化とマイグレーション実行
 * - getDatabase: 初期化済み接続の取得
 * - closeDatabase: 接続のクローズ
 *
 * ### 型定義
 * - DatabaseConfig: 接続設定
 * - DatabaseConnection: 接続オブジェクト型
 * - DatabaseError: エラー型
 *
 * @module lib/infrastructure/db
 *
 * @example
 * ```typescript
 * import {
 *   initializeDatabase,
 *   getDatabase,
 *   closeDatabase,
 *   type DatabaseConnection,
 * } from '@/lib/infrastructure/db';
 * import { isOk, isSome } from '@/lib/domain/shared';
 *
 * // アプリケーション起動時
 * const initResult = initializeDatabase();
 * if (!isOk(initResult)) {
 *   console.error('データベース初期化失敗:', initResult.error.message);
 *   process.exit(1);
 * }
 *
 * // データベース操作
 * const dbOption = getDatabase();
 * if (isSome(dbOption)) {
 *   const db = dbOption.value;
 *   const rows = db.prepare('SELECT * FROM settings').all();
 *   console.log('設定:', rows);
 * }
 *
 * // アプリケーション終了時
 * closeDatabase();
 * ```
 */

// ============================================================
// 接続管理
// ============================================================

export {
	/** データベース接続をクローズ */
	closeDatabase,
	/** 初期化済みデータベース接続を取得 */
	getDatabase,
	/** データベースを初期化（マイグレーション自動実行） */
	initializeDatabase,
	/** データベースが初期化済みかどうかを確認 */
	isDatabaseInitialized,
} from "./connection";

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

export { SqliteEventRepository } from "./event-repository";
