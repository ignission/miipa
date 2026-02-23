/**
 * セットアップ機能モジュール
 *
 * miipaアプリケーションのセットアップに関する機能を一括エクスポートします。
 * セットアップ状態の確認、APIキーの検証、設定の保存を提供します。
 *
 * @module lib/application/setup
 *
 * @example
 * ```typescript
 * import {
 *   checkSetupStatus,
 *   validateApiKey,
 *   saveSetupSettings,
 *   type SetupStatus,
 *   type SetupSettings,
 * } from '@/lib/application/setup';
 *
 * // セットアップ状態の確認
 * const statusResult = await checkSetupStatus();
 *
 * // APIキーの検証
 * const validateResult = await validateApiKey('claude', 'sk-ant-xxx');
 *
 * // 設定の保存
 * const saveResult = await saveSetupSettings({
 *   provider: 'claude',
 *   apiKey: 'sk-ant-xxx',
 * });
 * ```
 */

// ============================================================
// types.ts からのエクスポート
// ============================================================

// 型エクスポート
export type {
	SaveOptions,
	SetupSettings,
} from "./types";

// ============================================================
// validate-api-key.ts からのエクスポート
// ============================================================

export { validateApiKey } from "./validate-api-key";

// ============================================================
// save-setup-settings.ts からのエクスポート
// ============================================================

export { saveSetupSettings } from "./save-setup-settings";
