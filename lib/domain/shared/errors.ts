/**
 * アプリケーションエラー型モジュール
 *
 * アプリケーション全体で使用する共通エラー型を定義します。
 * 各エラーは文字列リテラルunionのcodeで判別可能であり、
 * 型安全なエラーハンドリングを実現します。
 *
 * @module lib/domain/shared/errors
 * @example
 * ```typescript
 * // エラーファクトリの使用
 * const error = configNotFound('設定ファイルが見つかりません');
 *
 * // エラーコードによる判別
 * switch (error.code) {
 *   case 'CONFIG_NOT_FOUND':
 *     // 設定ファイルの初期化処理
 *     break;
 *   case 'CONFIG_PARSE_ERROR':
 *     // パースエラーの表示
 *     break;
 * }
 *
 * // Result型との組み合わせ
 * function loadConfig(): Result<Config, ConfigError> {
 *   if (!fileExists) {
 *     return err(configNotFound('config.json が見つかりません'));
 *   }
 *   return ok(config);
 * }
 * ```
 */

// ============================================================
// 基底エラー型
// ============================================================

/**
 * アプリケーションエラーの基底インターフェース
 *
 * すべてのアプリケーションエラーはこのインターフェースを継承します。
 * discriminated union パターンにより、code フィールドで型を判別できます。
 *
 * @example
 * ```typescript
 * function handleError(error: AppError): void {
 *   console.error(`[${error.code}] ${error.message}`);
 *   if (error.cause) {
 *     console.error('原因:', error.cause);
 *   }
 * }
 * ```
 */
export interface AppError {
	/** エラーコード（型判別に使用） */
	readonly code: string;
	/** エラーメッセージ（日本語） */
	readonly message: string;
	/** エラーの原因（エラーチェーン用） */
	readonly cause?: unknown;
}

// ============================================================
// 設定関連エラー
// ============================================================

/**
 * 設定エラーコードの型定義
 */
export type ConfigErrorCode =
	| "CONFIG_NOT_FOUND"
	| "CONFIG_PARSE_ERROR"
	| "CONFIG_VALIDATION_ERROR"
	| "CONFIG_WRITE_FAILED";

/**
 * 設定関連エラー
 *
 * 設定ファイルの読み込み、パース、検証、書き込みに関するエラーを表現します。
 *
 * @example
 * ```typescript
 * const error: ConfigError = {
 *   code: 'CONFIG_NOT_FOUND',
 *   message: '設定ファイルが見つかりません: ~/.soloday/config.json',
 * };
 * ```
 */
export interface ConfigError extends AppError {
	/** 設定エラーコード */
	readonly code: ConfigErrorCode;
}

/**
 * 設定ファイルが見つからないエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns ConfigError
 *
 * @example
 * ```typescript
 * return err(configNotFound('~/.soloday/config.json が見つかりません'));
 * ```
 */
export function configNotFound(message?: string, cause?: unknown): ConfigError {
	return {
		code: "CONFIG_NOT_FOUND",
		message: message ?? "設定ファイルが見つかりません",
		cause,
	} as const;
}

/**
 * 設定ファイルのパースエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因（通常はJSONパースエラー）
 * @returns ConfigError
 *
 * @example
 * ```typescript
 * try {
 *   JSON.parse(content);
 * } catch (e) {
 *   return err(configParseError('JSONの形式が不正です', e));
 * }
 * ```
 */
export function configParseError(
	message?: string,
	cause?: unknown,
): ConfigError {
	return {
		code: "CONFIG_PARSE_ERROR",
		message: message ?? "設定ファイルの形式が不正です",
		cause,
	} as const;
}

/**
 * 設定ファイルのバリデーションエラーを生成
 *
 * @param message - エラーメッセージ（検証エラーの詳細を含む）
 * @param cause - エラーの原因（通常はZodエラー）
 * @returns ConfigError
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   return err(configValidationError('llm.provider が不正な値です', result.error));
 * }
 * ```
 */
export function configValidationError(
	message?: string,
	cause?: unknown,
): ConfigError {
	return {
		code: "CONFIG_VALIDATION_ERROR",
		message: message ?? "設定ファイルの値が不正です",
		cause,
	} as const;
}

/**
 * 設定ファイルの書き込みエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns ConfigError
 *
 * @example
 * ```typescript
 * try {
 *   await writeFile(configPath, content);
 * } catch (e) {
 *   return err(configWriteFailed('設定ファイルの保存に失敗しました', e));
 * }
 * ```
 */
export function configWriteFailed(
	message?: string,
	cause?: unknown,
): ConfigError {
	return {
		code: "CONFIG_WRITE_FAILED",
		message: message ?? "設定ファイルの保存に失敗しました",
		cause,
	} as const;
}

// ============================================================
// ファイルシステムエラー
// ============================================================

/**
 * ファイルシステムエラーコードの型定義
 */
export type FileSystemErrorCode =
	| "FILE_NOT_FOUND"
	| "FILE_READ_ERROR"
	| "FILE_WRITE_ERROR"
	| "DIRECTORY_CREATE_ERROR";

/**
 * ファイルシステムエラー
 *
 * ファイル・ディレクトリの操作に関するエラーを表現します。
 * パス情報を含むことで、エラー発生箇所を特定しやすくします。
 *
 * @example
 * ```typescript
 * const error: FileSystemError = {
 *   code: 'FILE_NOT_FOUND',
 *   message: 'ファイルが見つかりません',
 *   path: '~/.soloday/db.sqlite',
 * };
 * ```
 */
export interface FileSystemError extends AppError {
	/** ファイルシステムエラーコード */
	readonly code: FileSystemErrorCode;
	/** 対象のファイル/ディレクトリパス */
	readonly path: string;
}

/**
 * ファイルが見つからないエラーを生成
 *
 * @param path - 対象のファイルパス
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns FileSystemError
 *
 * @example
 * ```typescript
 * if (!existsSync(filePath)) {
 *   return err(fileNotFound(filePath));
 * }
 * ```
 */
export function fileNotFound(
	path: string,
	message?: string,
	cause?: unknown,
): FileSystemError {
	return {
		code: "FILE_NOT_FOUND",
		message: message ?? `ファイルが見つかりません: ${path}`,
		path,
		cause,
	} as const;
}

/**
 * ファイル読み込みエラーを生成
 *
 * @param path - 対象のファイルパス
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns FileSystemError
 *
 * @example
 * ```typescript
 * try {
 *   const content = await readFile(filePath, 'utf-8');
 * } catch (e) {
 *   return err(fileReadFailed(filePath, 'ファイルの読み込みに失敗しました', e));
 * }
 * ```
 */
export function fileReadFailed(
	path: string,
	message?: string,
	cause?: unknown,
): FileSystemError {
	return {
		code: "FILE_READ_ERROR",
		message: message ?? `ファイルの読み込みに失敗しました: ${path}`,
		path,
		cause,
	} as const;
}

/**
 * ファイル書き込みエラーを生成
 *
 * @param path - 対象のファイルパス
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns FileSystemError
 *
 * @example
 * ```typescript
 * try {
 *   await writeFile(filePath, content);
 * } catch (e) {
 *   return err(fileWriteFailed(filePath, 'ファイルの書き込みに失敗しました', e));
 * }
 * ```
 */
export function fileWriteFailed(
	path: string,
	message?: string,
	cause?: unknown,
): FileSystemError {
	return {
		code: "FILE_WRITE_ERROR",
		message: message ?? `ファイルの書き込みに失敗しました: ${path}`,
		path,
		cause,
	} as const;
}

/**
 * ディレクトリ作成エラーを生成
 *
 * @param path - 対象のディレクトリパス
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns FileSystemError
 *
 * @example
 * ```typescript
 * try {
 *   await mkdir(dirPath, { recursive: true });
 * } catch (e) {
 *   return err(directoryCreateFailed(dirPath, 'ディレクトリの作成に失敗しました', e));
 * }
 * ```
 */
export function directoryCreateFailed(
	path: string,
	message?: string,
	cause?: unknown,
): FileSystemError {
	return {
		code: "DIRECTORY_CREATE_ERROR",
		message: message ?? `ディレクトリの作成に失敗しました: ${path}`,
		path,
		cause,
	} as const;
}

// ============================================================
// Keychainエラー
// ============================================================

/**
 * Keychainエラーコードの型定義
 */
export type KeychainErrorCode =
	| "KEYCHAIN_ACCESS_DENIED"
	| "KEYCHAIN_ITEM_NOT_FOUND"
	| "KEYCHAIN_WRITE_FAILED";

/**
 * macOS Keychain操作エラー
 *
 * Keychainへの読み書き操作に関するエラーを表現します。
 * サービス名を含むことで、どの認証情報でエラーが発生したかを特定できます。
 *
 * @example
 * ```typescript
 * const error: KeychainError = {
 *   code: 'KEYCHAIN_ACCESS_DENIED',
 *   message: 'Keychainへのアクセスが拒否されました',
 *   service: 'com.soloday.app',
 * };
 * ```
 */
export interface KeychainError extends AppError {
	/** Keychainエラーコード */
	readonly code: KeychainErrorCode;
	/** Keychainサービス名 */
	readonly service: string;
}

/**
 * Keychainアクセス拒否エラーを生成
 *
 * macOSのセキュリティ設定によりKeychainへのアクセスが拒否された場合に使用します。
 *
 * @param service - Keychainサービス名
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns KeychainError
 *
 * @example
 * ```typescript
 * // ユーザーがKeychainアクセスを拒否した場合
 * return err(keychainAccessDenied('com.soloday.app'));
 * ```
 */
export function keychainAccessDenied(
	service: string,
	message?: string,
	cause?: unknown,
): KeychainError {
	return {
		code: "KEYCHAIN_ACCESS_DENIED",
		message:
			message ??
			`Keychainへのアクセスが拒否されました。システム環境設定でアクセスを許可してください: ${service}`,
		service,
		cause,
	} as const;
}

/**
 * Keychainアイテムが見つからないエラーを生成
 *
 * 指定したキーに対応する値がKeychainに存在しない場合に使用します。
 *
 * @param service - Keychainサービス名
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns KeychainError
 *
 * @example
 * ```typescript
 * const secret = await keytar.getPassword(service, key);
 * if (secret === null) {
 *   return err(keychainItemNotFound('com.soloday.app', `キー "${key}" が見つかりません`));
 * }
 * ```
 */
export function keychainItemNotFound(
	service: string,
	message?: string,
	cause?: unknown,
): KeychainError {
	return {
		code: "KEYCHAIN_ITEM_NOT_FOUND",
		message:
			message ??
			`Keychainに認証情報が見つかりません。初期設定を行ってください: ${service}`,
		service,
		cause,
	} as const;
}

/**
 * Keychain書き込みエラーを生成
 *
 * Keychainへの値の保存に失敗した場合に使用します。
 *
 * @param service - Keychainサービス名
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns KeychainError
 *
 * @example
 * ```typescript
 * try {
 *   await keytar.setPassword(service, key, value);
 * } catch (e) {
 *   return err(keychainWriteFailed('com.soloday.app', '認証情報の保存に失敗しました', e));
 * }
 * ```
 */
export function keychainWriteFailed(
	service: string,
	message?: string,
	cause?: unknown,
): KeychainError {
	return {
		code: "KEYCHAIN_WRITE_FAILED",
		message: message ?? `認証情報の保存に失敗しました: ${service}`,
		service,
		cause,
	} as const;
}

// ============================================================
// 型ガード
// ============================================================

/**
 * ConfigErrorかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns ConfigErrorの場合true
 *
 * @example
 * ```typescript
 * if (isConfigError(error)) {
 *   // error は ConfigError 型に絞り込まれる
 *   switch (error.code) {
 *     case 'CONFIG_NOT_FOUND':
 *       // ...
 *   }
 * }
 * ```
 */
export function isConfigError(error: AppError): error is ConfigError {
	return (
		error.code === "CONFIG_NOT_FOUND" ||
		error.code === "CONFIG_PARSE_ERROR" ||
		error.code === "CONFIG_VALIDATION_ERROR" ||
		error.code === "CONFIG_WRITE_FAILED"
	);
}

/**
 * FileSystemErrorかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns FileSystemErrorの場合true
 *
 * @example
 * ```typescript
 * if (isFileSystemError(error)) {
 *   // error は FileSystemError 型に絞り込まれる
 *   console.error(`パス: ${error.path}`);
 * }
 * ```
 */
export function isFileSystemError(error: AppError): error is FileSystemError {
	return (
		error.code === "FILE_NOT_FOUND" ||
		error.code === "FILE_READ_ERROR" ||
		error.code === "FILE_WRITE_ERROR" ||
		error.code === "DIRECTORY_CREATE_ERROR"
	);
}

// ============================================================
// データベースエラー
// ============================================================

/**
 * データベースエラーコードの型定義
 */
export type DbErrorCode =
	| "DB_CONNECTION_ERROR"
	| "DB_QUERY_ERROR"
	| "DB_WRITE_ERROR"
	| "DB_NOT_FOUND";

/**
 * データベース操作エラー
 *
 * SQLiteデータベースの操作に関するエラーを表現します。
 *
 * @example
 * ```typescript
 * const error: DbError = {
 *   code: 'DB_QUERY_ERROR',
 *   message: 'クエリの実行に失敗しました',
 *   query: 'SELECT * FROM events WHERE ...',
 * };
 * ```
 */
export interface DbError extends AppError {
	/** データベースエラーコード */
	readonly code: DbErrorCode;
	/** 失敗したクエリ（デバッグ用、省略可） */
	readonly query?: string;
}

/**
 * データベース接続エラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns DbError
 *
 * @example
 * ```typescript
 * return err(dbConnectionError('データベースに接続できません'));
 * ```
 */
export function dbConnectionError(message?: string, cause?: unknown): DbError {
	return {
		code: "DB_CONNECTION_ERROR",
		message: message ?? "データベースに接続できません",
		cause,
	} as const;
}

/**
 * データベースクエリエラーを生成
 *
 * @param message - エラーメッセージ
 * @param query - 失敗したクエリ
 * @param cause - エラーの原因
 * @returns DbError
 *
 * @example
 * ```typescript
 * try {
 *   db.prepare(sql).all();
 * } catch (e) {
 *   return err(dbQueryError('クエリの実行に失敗しました', sql, e));
 * }
 * ```
 */
export function dbQueryError(
	message?: string,
	query?: string,
	cause?: unknown,
): DbError {
	return {
		code: "DB_QUERY_ERROR",
		message: message ?? "クエリの実行に失敗しました",
		query,
		cause,
	} as const;
}

/**
 * データベース書き込みエラーを生成
 *
 * @param message - エラーメッセージ
 * @param query - 失敗したクエリ
 * @param cause - エラーの原因
 * @returns DbError
 *
 * @example
 * ```typescript
 * try {
 *   db.prepare(sql).run(params);
 * } catch (e) {
 *   return err(dbWriteError('データの保存に失敗しました', sql, e));
 * }
 * ```
 */
export function dbWriteError(
	message?: string,
	query?: string,
	cause?: unknown,
): DbError {
	return {
		code: "DB_WRITE_ERROR",
		message: message ?? "データの保存に失敗しました",
		query,
		cause,
	} as const;
}

/**
 * データベースレコード未検出エラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns DbError
 *
 * @example
 * ```typescript
 * const row = db.prepare(sql).get(id);
 * if (!row) {
 *   return err(dbNotFound(`ID: ${id} のレコードが見つかりません`));
 * }
 * ```
 */
export function dbNotFound(message?: string, cause?: unknown): DbError {
	return {
		code: "DB_NOT_FOUND",
		message: message ?? "レコードが見つかりません",
		cause,
	} as const;
}

/**
 * DbErrorかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns DbErrorの場合true
 *
 * @example
 * ```typescript
 * if (isDbError(error)) {
 *   // error は DbError 型に絞り込まれる
 *   if (error.query) {
 *     console.error(`クエリ: ${error.query}`);
 *   }
 * }
 * ```
 */
export function isDbError(error: AppError): error is DbError {
	return (
		error.code === "DB_CONNECTION_ERROR" ||
		error.code === "DB_QUERY_ERROR" ||
		error.code === "DB_WRITE_ERROR" ||
		error.code === "DB_NOT_FOUND"
	);
}

/**
 * KeychainErrorかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns KeychainErrorの場合true
 *
 * @example
 * ```typescript
 * if (isKeychainError(error)) {
 *   // error は KeychainError 型に絞り込まれる
 *   console.error(`サービス: ${error.service}`);
 * }
 * ```
 */
export function isKeychainError(error: AppError): error is KeychainError {
	return (
		error.code === "KEYCHAIN_ACCESS_DENIED" ||
		error.code === "KEYCHAIN_ITEM_NOT_FOUND" ||
		error.code === "KEYCHAIN_WRITE_FAILED"
	);
}

// ============================================================
// ユーティリティ
// ============================================================

/**
 * エラーをJSONシリアライズ可能なオブジェクトに変換
 *
 * causeがErrorインスタンスの場合、message, name, stackを含むオブジェクトに変換します。
 *
 * @param error - 変換対象のエラー
 * @returns シリアライズ可能なエラーオブジェクト
 *
 * @example
 * ```typescript
 * const serialized = toSerializable(error);
 * const json = JSON.stringify(serialized);
 * ```
 */
export function toSerializable(error: AppError): Record<string, unknown> {
	const result: Record<string, unknown> = {
		code: error.code,
		message: error.message,
	};

	if (error.cause !== undefined) {
		if (error.cause instanceof Error) {
			result.cause = {
				name: error.cause.name,
				message: error.cause.message,
				stack: error.cause.stack,
			};
		} else {
			result.cause = error.cause;
		}
	}

	// FileSystemError の path を含める
	if ("path" in error) {
		result.path = (error as FileSystemError).path;
	}

	// KeychainError の service を含める
	if ("service" in error) {
		result.service = (error as KeychainError).service;
	}

	// DbError の query を含める
	if ("query" in error) {
		result.query = (error as DbError).query;
	}

	return result;
}

/**
 * エラーメッセージを整形して取得
 *
 * エラーコードとメッセージを組み合わせた文字列を返します。
 *
 * @param error - 対象のエラー
 * @returns 整形されたエラーメッセージ
 *
 * @example
 * ```typescript
 * const message = formatError(error);
 * // "[CONFIG_NOT_FOUND] 設定ファイルが見つかりません"
 * ```
 */
export function formatError(error: AppError): string {
	return `[${error.code}] ${error.message}`;
}
