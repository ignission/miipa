/**
 * SQLiteデータベース接続管理モジュール
 *
 * better-sqlite3を使用したデータベース接続の初期化、取得、クローズを提供します。
 * シングルトンパターンでデータベース接続を管理し、マイグレーションの自動実行を行います。
 *
 * @module lib/infrastructure/db/connection
 *
 * @example
 * ```typescript
 * import { initializeDatabase, getDatabase, closeDatabase } from '@/lib/infrastructure/db';
 * import { isOk, isSome, match } from '@/lib/domain/shared';
 *
 * // 初期化
 * const result = initializeDatabase();
 * if (isOk(result)) {
 *   console.log('データベースの初期化に成功しました');
 * }
 *
 * // 接続の取得
 * const dbOption = getDatabase();
 * if (isSome(dbOption)) {
 *   const db = dbOption.value;
 *   // DBを使用した処理
 * }
 *
 * // 終了時
 * closeDatabase();
 * ```
 */

import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { DB_PATH } from "@/lib/config/paths";
import {
	err,
	none,
	type Option,
	ok,
	type Result,
	some,
} from "@/lib/domain/shared";

import type { DatabaseConnection, DatabaseError, MigrationFile } from "./types";
import { databaseMigrationError, databaseOpenError } from "./types";

// ============================================================
// シングルトン接続管理
// ============================================================

/**
 * グローバルデータベース接続インスタンス
 *
 * シングルトンパターンにより、アプリケーション全体で一つの接続を共有します。
 */
let databaseInstance: DatabaseConnection | null = null;

// ============================================================
// マイグレーション管理
// ============================================================

/**
 * マイグレーションディレクトリのパス
 */
const MIGRATIONS_DIR = join(
	dirname(import.meta.url.replace("file://", "")),
	"migrations",
);

/**
 * マイグレーションファイルを取得
 *
 * migrationsディレクトリからSQLファイルを読み込み、
 * ファイル名のプレフィックス番号でソートして返します。
 *
 * @returns マイグレーションファイルの配列（ID順）
 */
function getMigrationFiles(): MigrationFile[] {
	try {
		const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));

		return files
			.map((filename) => {
				// ファイル名から ID を抽出 (例: 001_initial.sql -> 1)
				const match = filename.match(/^(\d+)_(.+)\.sql$/);
				if (!match) {
					return null;
				}

				return {
					id: parseInt(match[1], 10),
					name: filename.replace(".sql", ""),
					path: join(MIGRATIONS_DIR, filename),
				} satisfies MigrationFile;
			})
			.filter((m): m is MigrationFile => m !== null)
			.sort((a, b) => a.id - b.id);
	} catch {
		// migrationsディレクトリが存在しない場合は空配列を返す
		return [];
	}
}

/**
 * 実行済みマイグレーションのIDを取得
 *
 * @param db - データベース接続
 * @returns 実行済みマイグレーションIDの配列
 */
function getExecutedMigrationIds(db: DatabaseConnection): number[] {
	try {
		// migrationsテーブルが存在するか確認
		const tableExists = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'",
			)
			.get();

		if (!tableExists) {
			return [];
		}

		const rows = db.prepare("SELECT id FROM migrations ORDER BY id").all() as {
			id: number;
		}[];
		return rows.map((row) => row.id);
	} catch {
		return [];
	}
}

/**
 * マイグレーションを実行
 *
 * 未実行のマイグレーションをトランザクション内で順番に実行します。
 *
 * @param db - データベース接続
 * @returns 成功時はOk<void>、失敗時はErr<DatabaseError>
 */
function runMigrations(db: DatabaseConnection): Result<void, DatabaseError> {
	const migrations = getMigrationFiles();
	const executedIds = getExecutedMigrationIds(db);

	// 未実行のマイグレーションをフィルタ
	const pendingMigrations = migrations.filter(
		(m) => !executedIds.includes(m.id),
	);

	if (pendingMigrations.length === 0) {
		// 実行するマイグレーションがない
		return ok(undefined);
	}

	try {
		// トランザクション内で全マイグレーションを実行
		const runAll = db.transaction(() => {
			for (const migration of pendingMigrations) {
				const sql = readFileSync(migration.path, "utf-8");

				// マイグレーションSQLを実行
				db.exec(sql);

				// 実行記録を追加（migrationsテーブルが作成された後）
				const insertStmt = db.prepare(
					"INSERT OR IGNORE INTO migrations (id, name, executed_at) VALUES (?, ?, datetime('now'))",
				);
				insertStmt.run(migration.id, migration.name);
			}
		});

		runAll();
		return ok(undefined);
	} catch (error) {
		return err(
			databaseMigrationError(
				`マイグレーションの実行に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
				error,
			),
		);
	}
}

// ============================================================
// 公開API
// ============================================================

/**
 * データベースを初期化
 *
 * ~/.soloday/db.sqlite にSQLiteデータベースを作成し、
 * マイグレーションを自動実行します。
 *
 * 既に初期化済みの場合は、既存の接続を再利用します。
 *
 * @returns 成功時はOk<DatabaseConnection>、失敗時はErr<DatabaseError>
 *
 * @example
 * ```typescript
 * const result = initializeDatabase();
 *
 * match(result, {
 *   ok: (db) => console.log('初期化成功'),
 *   err: (error) => console.error(`[${error.code}] ${error.message}`),
 * });
 * ```
 */
export function initializeDatabase(): Result<
	DatabaseConnection,
	DatabaseError
> {
	// 既に初期化済みの場合は既存の接続を返す
	if (databaseInstance !== null) {
		return ok(databaseInstance);
	}

	try {
		// データベースディレクトリを作成
		const dbDir = dirname(DB_PATH);
		mkdirSync(dbDir, { recursive: true });

		// データベース接続を開く
		// better-sqlite3 は同期APIなので、ファイルが存在しない場合は自動作成される
		const db = new Database(DB_PATH, {
			// WALモードを有効化（パフォーマンス向上）
			// readonly: false,
		});

		// WALモードを有効化
		db.pragma("journal_mode = WAL");

		// 外部キー制約を有効化
		db.pragma("foreign_keys = ON");

		// マイグレーションを実行
		const migrationResult = runMigrations(db);
		if (migrationResult._tag === "Err") {
			db.close();
			return migrationResult;
		}

		// シングルトンインスタンスを保存
		databaseInstance = db;

		return ok(db);
	} catch (error) {
		return err(
			databaseOpenError(
				`データベースのオープンに失敗しました: ${DB_PATH}`,
				error,
			),
		);
	}
}

/**
 * データベース接続を取得
 *
 * 初期化済みのデータベース接続を返します。
 * 未初期化の場合はNoneを返します。
 *
 * @returns 初期化済みの場合はSome<DatabaseConnection>、未初期化の場合はNone
 *
 * @example
 * ```typescript
 * const dbOption = getDatabase();
 *
 * match(dbOption, {
 *   some: (db) => {
 *     // DBを使用した処理
 *     const stmt = db.prepare('SELECT * FROM settings');
 *     const rows = stmt.all();
 *   },
 *   none: () => {
 *     console.error('データベースが初期化されていません');
 *   },
 * });
 * ```
 */
export function getDatabase(): Option<DatabaseConnection> {
	if (databaseInstance === null) {
		return none();
	}
	return some(databaseInstance);
}

/**
 * データベース接続をクローズ
 *
 * データベース接続を閉じ、リソースを解放します。
 * 未初期化の場合は何もしません。
 *
 * アプリケーション終了時やテスト後のクリーンアップに使用します。
 *
 * @example
 * ```typescript
 * // アプリケーション終了時
 * process.on('exit', () => {
 *   closeDatabase();
 * });
 *
 * // テスト後のクリーンアップ
 * afterEach(() => {
 *   closeDatabase();
 * });
 * ```
 */
export function closeDatabase(): void {
	if (databaseInstance !== null) {
		try {
			databaseInstance.close();
		} catch {
			// クローズ時のエラーは無視（既にクローズされている可能性がある）
		} finally {
			databaseInstance = null;
		}
	}
}

/**
 * データベースが初期化済みかどうかを確認
 *
 * @returns 初期化済みの場合はtrue
 *
 * @example
 * ```typescript
 * if (!isDatabaseInitialized()) {
 *   const result = initializeDatabase();
 *   // ...
 * }
 * ```
 */
export function isDatabaseInitialized(): boolean {
	return databaseInstance !== null;
}
