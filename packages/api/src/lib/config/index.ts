/**
 * 設定管理モジュール
 *
 * miipaアプリケーションの設定管理に関する機能を提供します。
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
	/** カレンダー設定 */
	CalendarConfig,
} from "./types";
