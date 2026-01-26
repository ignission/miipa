/**
 * 設定管理モジュール
 *
 * SoloDayアプリケーションの設定管理に関する機能を提供します。
 *
 * ## 提供する機能
 *
 * ### パス定数
 * - `SOLODAY_DIR`: データディレクトリ (~/.soloday)
 * - `CONFIG_PATH`: 設定ファイルパス (~/.soloday/config.json)
 * - `DB_PATH`: データベースファイルパス (~/.soloday/db.sqlite)
 *
 * ### ディレクトリ初期化
 * - `ensureDirectory()`: SoloDayデータディレクトリを作成
 * - `ensureDirectoryAt()`: 任意のディレクトリパスを作成
 *
 * ### 設定型定義
 * - `AppConfig`: アプリケーション設定のルート型
 * - `LLMConfig`: LLMプロバイダ設定
 * - `CalendarConfig`: カレンダー設定
 * - `UIConfig`: UI設定
 * - Zodスキーマによるランタイムバリデーション
 *
 * @module lib/config
 *
 * @example
 * ```typescript
 * import {
 *   SOLODAY_DIR,
 *   CONFIG_PATH,
 *   DB_PATH,
 *   ensureDirectory,
 *   type AppConfig,
 *   AppConfigSchema,
 *   DEFAULT_CONFIG,
 * } from '@/lib/config';
 *
 * // アプリケーション初期化時にディレクトリを確保
 * const result = await ensureDirectory();
 * if (isErr(result)) {
 *   console.error('初期化失敗:', result.error.message);
 *   process.exit(1);
 * }
 *
 * // 設定のバリデーション
 * const configResult = AppConfigSchema.safeParse(jsonData);
 * if (configResult.success) {
 *   const config: AppConfig = configResult.data;
 * }
 * ```
 */

// ============================================================
// パス定数とディレクトリ初期化
// ============================================================

export {
	/** 設定ファイルパス (~/.soloday/config.json) */
	CONFIG_PATH,
	/** SQLiteデータベースファイルパス (~/.soloday/db.sqlite) */
	DB_PATH,
	/** SoloDayデータディレクトリを作成 */
	ensureDirectory,
	/** 指定されたディレクトリパスを作成 */
	ensureDirectoryAt,
	/** SoloDayのデータディレクトリパス (~/.soloday) */
	SOLODAY_DIR,
} from "./paths";

// ============================================================
// 設定型定義とZodスキーマ
// ============================================================

/**
 * 設定型定義のエクスポート
 *
 * Zodスキーマから推論された型とスキーマを提供します。
 * ランタイムバリデーションと型安全性を両立させます。
 */
export type {
	/** アプリケーション設定のルート型 */
	AppConfig,
	/** カレンダー設定 */
	CalendarConfig,
	/** カレンダータイプ識別子 */
	CalendarType,
	/** LLMプロバイダ設定 */
	LLMConfig,
	/** LLMプロバイダ識別子 */
	LLMProvider,
	/** 表示言語設定 */
	Locale,
	/** テーマモード設定 */
	ThemeMode,
	/** UI設定 */
	UIConfig,
} from "./types";

export {
	/** アプリケーション設定のZodスキーマ */
	AppConfigSchema,
	/** カレンダー設定のZodスキーマ */
	CalendarConfigSchema,
	/** デフォルトのアプリケーション設定 */
	DEFAULT_CONFIG,
	/** CalendarTypeの型ガード */
	isCalendarType,
	/** LLMProviderの型ガード */
	isLLMProvider,
	/** Localeの型ガード */
	isLocale,
	/** ThemeModeの型ガード */
	isThemeMode,
	/** LLMプロバイダ設定のZodスキーマ */
	LLMConfigSchema,
	/** UI設定のZodスキーマ */
	UIConfigSchema,
} from "./types";

// ============================================================
// 設定ローダー
// ============================================================

/**
 * 設定ローダーのエクスポート
 *
 * 設定ファイルの読み込み、保存、初期化機能を提供します。
 * すべての操作はResult型を返し、例外をスローしません。
 */
export {
	/** 設定ファイルが存在するかを確認 */
	configExists,
	/** デフォルト設定を生成してファイルに保存 */
	initializeConfig,
	/** 設定ファイルを読み込みバリデーション */
	loadConfig,
	/** 設定を読み込むか、存在しない場合は初期化 */
	loadOrInitializeConfig,
	/** 設定をファイルに保存 */
	saveConfig,
} from "./loader";

// ============================================================
// バリデーター
// ============================================================

/**
 * バリデーター関数のエクスポート
 *
 * 任意のデータをAppConfigとしてバリデーションする関数を提供します。
 * Zodスキーマを使用し、結果はResult型で返されます。
 */
export {
	/** 任意のデータをAppConfigとしてバリデーション */
	validateConfig,
	/** 部分的な設定データをバリデーション */
	validatePartialConfig,
} from "./validator";
