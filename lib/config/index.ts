/**
 * 設定管理モジュール
 *
 * SoloDayアプリケーションの設定管理に関する機能を提供します。
 *
 * ## 提供する機能
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
 *   type AppConfig,
 *   AppConfigSchema,
 *   DEFAULT_CONFIG,
 * } from '@/lib/config';
 *
 * // 設定のバリデーション
 * const configResult = AppConfigSchema.safeParse(jsonData);
 * if (configResult.success) {
 *   const config: AppConfig = configResult.data;
 * }
 * ```
 */

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
