/**
 * 設定ローダーモジュール
 *
 * SoloDayアプリケーションの設定ファイル（~/.soloday/config.json）の
 * 読み込み、保存、初期化機能を提供します。
 *
 * すべての操作はResult型を返し、例外をスローしません。
 * ファイル操作はfs/promisesを使用して非同期で行われます。
 *
 * @module lib/config/loader
 *
 * @example
 * ```typescript
 * import { loadConfig, saveConfig, initializeConfig } from '@/lib/config/loader';
 * import { isOk, match } from '@/lib/domain/shared';
 *
 * // 設定の読み込み
 * const result = await loadConfig();
 * if (isOk(result)) {
 *   console.log('LLMプロバイダ:', result.value.llm.provider);
 * }
 *
 * // 設定の保存
 * const saveResult = await saveConfig({
 *   ...config,
 *   ui: { theme: 'dark', language: 'ja' },
 * });
 *
 * // 初期設定の生成
 * const initResult = await initializeConfig();
 * ```
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
	type ConfigError,
	configNotFound,
	configParseError,
	configValidationError,
	configWriteFailed,
	err,
	isErr,
	ok,
	type Result,
} from "@/lib/domain/shared";

import { CONFIG_PATH, ensureDirectoryAt } from "./paths";
import { type AppConfig, AppConfigSchema, DEFAULT_CONFIG } from "./types";

// ============================================================
// 設定ファイル読み込み
// ============================================================

/**
 * 設定ファイルを読み込みバリデーション
 *
 * `~/.soloday/config.json` から設定を読み込み、
 * Zodスキーマでバリデーションを行います。
 *
 * @returns 成功時はOk<AppConfig>、失敗時はErr<ConfigError>
 *
 * @remarks
 * 以下のエラーが発生する可能性があります:
 * - CONFIG_NOT_FOUND: 設定ファイルが存在しない
 * - CONFIG_PARSE_ERROR: JSONパースエラー
 * - CONFIG_VALIDATION_ERROR: スキーマバリデーションエラー
 *
 * @example
 * ```typescript
 * const result = await loadConfig();
 *
 * match(result, {
 *   ok: (config) => {
 *     console.log('設定を読み込みました');
 *     console.log('プロバイダ:', config.llm.provider);
 *   },
 *   err: (error) => {
 *     if (error.code === 'CONFIG_NOT_FOUND') {
 *       // 初期設定を生成
 *       await initializeConfig();
 *     } else {
 *       console.error(`[${error.code}] ${error.message}`);
 *     }
 *   },
 * });
 * ```
 */
export async function loadConfig(): Promise<Result<AppConfig, ConfigError>> {
	// ファイル読み込み
	let fileContent: string;
	try {
		fileContent = await readFile(CONFIG_PATH, "utf-8");
	} catch (error) {
		// ファイルが存在しない場合
		if (isNodeError(error) && error.code === "ENOENT") {
			return err(
				configNotFound(`設定ファイルが見つかりません: ${CONFIG_PATH}`, error),
			);
		}
		// その他のファイル読み込みエラー
		return err(
			configParseError(
				`設定ファイルの読み込みに失敗しました: ${CONFIG_PATH}`,
				error,
			),
		);
	}

	// JSONパース
	let rawConfig: unknown;
	try {
		rawConfig = JSON.parse(fileContent);
	} catch (error) {
		return err(
			configParseError(
				`設定ファイルのJSON形式が不正です: ${CONFIG_PATH}`,
				error,
			),
		);
	}

	// Zodスキーマでバリデーション
	const validationResult = AppConfigSchema.safeParse(rawConfig);
	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join(", ");
		return err(
			configValidationError(
				`設定ファイルのバリデーションに失敗しました: ${errorMessages}`,
				validationResult.error,
			),
		);
	}

	return ok(validationResult.data);
}

// ============================================================
// 設定ファイル保存
// ============================================================

/**
 * 設定をファイルに保存
 *
 * AppConfigオブジェクトを `~/.soloday/config.json` に保存します。
 * ディレクトリが存在しない場合は自動的に作成されます。
 *
 * @param config - 保存する設定オブジェクト
 * @returns 成功時はOk<void>、失敗時はErr<ConfigError>
 *
 * @remarks
 * - JSONは2スペースのインデントで整形されます
 * - ディレクトリ作成に失敗した場合もConfigErrorを返します
 * - 保存前にZodスキーマでバリデーションを行います
 *
 * @example
 * ```typescript
 * const config: AppConfig = {
 *   version: '1.0.0',
 *   llm: { provider: 'claude' },
 *   calendars: [],
 *   ui: { theme: 'system', language: 'ja' },
 * };
 *
 * const result = await saveConfig(config);
 *
 * if (isOk(result)) {
 *   console.log('設定を保存しました');
 * } else {
 *   console.error(`保存に失敗: ${result.error.message}`);
 * }
 * ```
 */
export async function saveConfig(
	config: AppConfig,
): Promise<Result<void, ConfigError>> {
	// 保存前にバリデーション
	const validationResult = AppConfigSchema.safeParse(config);
	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues
			.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
			.join(", ");
		return err(
			configValidationError(
				`保存する設定が不正です: ${errorMessages}`,
				validationResult.error,
			),
		);
	}

	// ディレクトリの確認・作成
	const dirPath = dirname(CONFIG_PATH);
	const dirResult = await ensureDirectoryAt(dirPath);
	if (isErr(dirResult)) {
		return err(
			configWriteFailed(
				`設定ディレクトリの作成に失敗しました: ${dirPath}`,
				dirResult.error,
			),
		);
	}

	// JSONに整形
	const jsonContent = JSON.stringify(validationResult.data, null, 2);

	// ファイル書き込み
	try {
		await writeFile(CONFIG_PATH, jsonContent, "utf-8");
	} catch (error) {
		return err(
			configWriteFailed(
				`設定ファイルの保存に失敗しました: ${CONFIG_PATH}`,
				error,
			),
		);
	}

	return ok(undefined);
}

// ============================================================
// 初期設定の生成
// ============================================================

/**
 * デフォルト設定を生成してファイルに保存
 *
 * 初回起動時や設定ファイルが見つからない場合に使用します。
 * デフォルト値で設定ファイルを作成し、その内容を返します。
 *
 * @returns 成功時はOk<AppConfig>（生成された設定）、失敗時はErr<ConfigError>
 *
 * @remarks
 * デフォルト設定は以下の値を持ちます:
 * - version: "1.0.0"
 * - llm.provider: "claude"
 * - calendars: []（空配列）
 * - ui.theme: "system"
 * - ui.language: "ja"
 *
 * @example
 * ```typescript
 * // 設定ファイルが見つからない場合に初期化
 * const loadResult = await loadConfig();
 *
 * if (isErr(loadResult) && loadResult.error.code === 'CONFIG_NOT_FOUND') {
 *   const initResult = await initializeConfig();
 *   if (isOk(initResult)) {
 *     console.log('初期設定を作成しました');
 *     return initResult.value;
 *   }
 * }
 * ```
 */
export async function initializeConfig(): Promise<
	Result<AppConfig, ConfigError>
> {
	// デフォルト設定を保存
	const saveResult = await saveConfig(DEFAULT_CONFIG);
	if (isErr(saveResult)) {
		return saveResult;
	}

	// 保存した設定を返す
	return ok({ ...DEFAULT_CONFIG });
}

// ============================================================
// ユーティリティ
// ============================================================

/**
 * Node.jsのファイルシステムエラーかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns Node.jsエラー（codeプロパティを持つ）の場合true
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return (
		error !== null &&
		typeof error === "object" &&
		"code" in error &&
		typeof (error as { code: unknown }).code === "string"
	);
}

/**
 * 設定ファイルが存在するかを確認
 *
 * 設定ファイルの存在確認のみを行い、内容のバリデーションは行いません。
 * 素早い存在確認が必要な場合に使用します。
 *
 * @returns 成功時はOk<boolean>（存在する場合true）、失敗時はErr<ConfigError>
 *
 * @example
 * ```typescript
 * const result = await configExists();
 * if (isOk(result) && !result.value) {
 *   // 設定ファイルが存在しない場合
 *   await initializeConfig();
 * }
 * ```
 */
export async function configExists(): Promise<Result<boolean, ConfigError>> {
	try {
		await readFile(CONFIG_PATH);
		return ok(true);
	} catch (error) {
		if (isNodeError(error) && error.code === "ENOENT") {
			return ok(false);
		}
		return err(
			configParseError(
				`設定ファイルの存在確認に失敗しました: ${CONFIG_PATH}`,
				error,
			),
		);
	}
}

/**
 * 設定を読み込むか、存在しない場合は初期化
 *
 * loadConfigとinitializeConfigを組み合わせた便利関数です。
 * 設定ファイルが存在すれば読み込み、存在しなければ初期設定を生成します。
 *
 * @returns 成功時はOk<AppConfig>、失敗時はErr<ConfigError>
 *
 * @example
 * ```typescript
 * // 常に設定を取得できる（存在しなければ作成）
 * const result = await loadOrInitializeConfig();
 * if (isOk(result)) {
 *   const config = result.value;
 *   // 設定を使用
 * }
 * ```
 */
export async function loadOrInitializeConfig(): Promise<
	Result<AppConfig, ConfigError>
> {
	const loadResult = await loadConfig();

	if (isErr(loadResult)) {
		// ファイルが見つからない場合のみ初期化
		if (loadResult.error.code === "CONFIG_NOT_FOUND") {
			return initializeConfig();
		}
		// その他のエラーはそのまま返す
		return loadResult;
	}

	return loadResult;
}
