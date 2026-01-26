/**
 * 設定パス定数モジュール
 *
 * SoloDayアプリケーションで使用するファイルパスの定数と
 * ディレクトリ初期化のユーティリティ関数を提供します。
 *
 * データは `~/.soloday/` ディレクトリに保存されます:
 * - config.json: アプリケーション設定（非機密情報）
 * - db.sqlite: カレンダーキャッシュ、セッション情報
 * - 機密情報はmacOS Keychainに保存
 *
 * @module lib/config/paths
 * @example
 * ```typescript
 * import { SOLODAY_DIR, CONFIG_PATH, DB_PATH, ensureDirectory } from '@/lib/config/paths';
 *
 * // ディレクトリの初期化
 * const result = await ensureDirectory();
 * if (isOk(result)) {
 *   console.log(`ディレクトリ作成完了: ${SOLODAY_DIR}`);
 * }
 * ```
 */

import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import {
	directoryCreateFailed,
	err,
	type FileSystemError,
	ok,
	type Result,
} from "@/lib/domain/shared";

// ============================================================
// パス定数
// ============================================================

/**
 * SoloDayのデータディレクトリパス
 *
 * ユーザーのホームディレクトリ配下の `.soloday` ディレクトリを指します。
 * このディレクトリに設定ファイルとSQLiteデータベースが保存されます。
 *
 * @example
 * ```typescript
 * // macOSの場合: /Users/username/.soloday
 * console.log(SOLODAY_DIR);
 * ```
 */
export const SOLODAY_DIR: string = join(homedir(), ".soloday");

/**
 * 設定ファイルパス
 *
 * アプリケーション設定を保存するJSONファイルのパスです。
 * LLMプロバイダ設定、カレンダー設定、UI設定などの非機密情報を保存します。
 *
 * @example
 * ```typescript
 * // macOSの場合: /Users/username/.soloday/config.json
 * console.log(CONFIG_PATH);
 * ```
 */
export const CONFIG_PATH: string = join(SOLODAY_DIR, "config.json");

/**
 * SQLiteデータベースファイルパス
 *
 * カレンダーキャッシュ、セッション情報などを保存するSQLiteデータベースのパスです。
 *
 * @example
 * ```typescript
 * // macOSの場合: /Users/username/.soloday/db.sqlite
 * console.log(DB_PATH);
 * ```
 */
export const DB_PATH: string = join(SOLODAY_DIR, "db.sqlite");

// ============================================================
// ディレクトリ初期化
// ============================================================

/**
 * SoloDayデータディレクトリを作成
 *
 * `~/.soloday` ディレクトリが存在しない場合に作成します。
 * 既に存在する場合は何もせず成功を返します。
 *
 * この関数はモジュールのimport時には実行されません。
 * アプリケーションの初期化時に明示的に呼び出す必要があります。
 *
 * @returns 成功時はOk<void>、失敗時はErr<FileSystemError>
 *
 * @example
 * ```typescript
 * import { ensureDirectory, SOLODAY_DIR } from '@/lib/config/paths';
 * import { isOk, isErr, match } from '@/lib/domain/shared';
 *
 * const result = await ensureDirectory();
 *
 * match(result, {
 *   ok: () => console.log('ディレクトリ準備完了'),
 *   err: (error) => {
 *     console.error(`[${error.code}] ${error.message}`);
 *     console.error(`パス: ${error.path}`);
 *   },
 * });
 * ```
 */
export async function ensureDirectory(): Promise<
	Result<void, FileSystemError>
> {
	try {
		// recursive: true により、既に存在する場合はエラーにならない
		// ネストされたディレクトリも一度に作成可能
		await mkdir(SOLODAY_DIR, { recursive: true });
		return ok(undefined);
	} catch (error) {
		return err(
			directoryCreateFailed(
				SOLODAY_DIR,
				`SoloDayデータディレクトリの作成に失敗しました: ${SOLODAY_DIR}`,
				error,
			),
		);
	}
}

/**
 * 指定されたディレクトリパスを作成
 *
 * 任意のディレクトリパスを再帰的に作成します。
 * テストやカスタムパス指定時に使用します。
 *
 * @param dirPath - 作成するディレクトリのパス
 * @returns 成功時はOk<void>、失敗時はErr<FileSystemError>
 *
 * @example
 * ```typescript
 * // テスト用の一時ディレクトリを作成
 * const result = await ensureDirectoryAt('/tmp/soloday-test');
 * ```
 */
export async function ensureDirectoryAt(
	dirPath: string,
): Promise<Result<void, FileSystemError>> {
	try {
		await mkdir(dirPath, { recursive: true });
		return ok(undefined);
	} catch (error) {
		return err(
			directoryCreateFailed(
				dirPath,
				`ディレクトリの作成に失敗しました: ${dirPath}`,
				error,
			),
		);
	}
}
