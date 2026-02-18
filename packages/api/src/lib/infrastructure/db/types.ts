/**
 * データベース型定義モジュール
 *
 * Cloudflare D1を使用したデータベース操作に関する型定義を提供します。
 * 型安全なデータベース操作を実現するための基盤型です。
 *
 * @module lib/infrastructure/db/types
 */

// ============================================================
// 設定テーブル関連の型定義
// ============================================================

/**
 * 設定値の行データ
 *
 * settingsテーブルの行を表現します。
 */
export interface SettingRow {
	/** 設定キー */
	readonly key: string;
	/** 設定値（JSON文字列） */
	readonly value: string;
	/** 最終更新日時（ISO 8601形式） */
	readonly updated_at: string;
}

// ============================================================
// データベースエラー関連の型定義
// ============================================================

/**
 * データベースエラーコードの型定義
 */
export type DatabaseErrorCode =
	| "DATABASE_OPEN_ERROR"
	| "DATABASE_CLOSE_ERROR"
	| "DATABASE_MIGRATION_ERROR"
	| "DATABASE_QUERY_ERROR"
	| "DATABASE_NOT_INITIALIZED";

/**
 * データベースエラー
 *
 * D1操作に関するエラーを表現します。
 */
export interface DatabaseError {
	/** エラーコード（型判別に使用） */
	readonly code: DatabaseErrorCode;
	/** エラーメッセージ（日本語） */
	readonly message: string;
	/** エラーの原因（エラーチェーン用） */
	readonly cause?: unknown;
}

// ============================================================
// エラーファクトリ関数
// ============================================================

/**
 * データベースオープンエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns DatabaseError
 */
export function databaseOpenError(
	message?: string,
	cause?: unknown,
): DatabaseError {
	return {
		code: "DATABASE_OPEN_ERROR",
		message: message ?? "データベースのオープンに失敗しました",
		cause,
	} as const;
}

/**
 * データベースクローズエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns DatabaseError
 */
export function databaseCloseError(
	message?: string,
	cause?: unknown,
): DatabaseError {
	return {
		code: "DATABASE_CLOSE_ERROR",
		message: message ?? "データベースのクローズに失敗しました",
		cause,
	} as const;
}

/**
 * マイグレーションエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns DatabaseError
 */
export function databaseMigrationError(
	message?: string,
	cause?: unknown,
): DatabaseError {
	return {
		code: "DATABASE_MIGRATION_ERROR",
		message: message ?? "マイグレーションの実行に失敗しました",
		cause,
	} as const;
}

/**
 * クエリエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns DatabaseError
 */
export function databaseQueryError(
	message?: string,
	cause?: unknown,
): DatabaseError {
	return {
		code: "DATABASE_QUERY_ERROR",
		message: message ?? "クエリの実行に失敗しました",
		cause,
	} as const;
}

/**
 * データベース未初期化エラーを生成
 *
 * @param message - エラーメッセージ
 * @returns DatabaseError
 */
export function databaseNotInitializedError(message?: string): DatabaseError {
	return {
		code: "DATABASE_NOT_INITIALIZED",
		message:
			message ??
			"データベースが初期化されていません。initializeDatabase()を先に呼び出してください",
	} as const;
}

/**
 * DatabaseErrorかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns DatabaseErrorの場合true
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		typeof (error as DatabaseError).code === "string" &&
		[
			"DATABASE_OPEN_ERROR",
			"DATABASE_CLOSE_ERROR",
			"DATABASE_MIGRATION_ERROR",
			"DATABASE_QUERY_ERROR",
			"DATABASE_NOT_INITIALIZED",
		].includes((error as DatabaseError).code)
	);
}
