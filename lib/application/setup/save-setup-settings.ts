/**
 * セットアップ設定保存ユースケース
 *
 * セットアップ設定を暗号化DBとD1設定テーブルに保存する機能を提供します。
 * APIキーは暗号化されてD1に、プロバイダ設定はuser_settingsテーブルに保存されます。
 *
 * @module lib/application/setup/save-setup-settings
 *
 * @example
 * ```typescript
 * import { saveSetupSettings } from '@/lib/application/setup/save-setup-settings';
 * import type { SetupSettings } from '@/lib/application/setup/types';
 * import { isOk, isErr } from '@/lib/domain/shared';
 * import { createCalendarContext } from '@/lib/context/calendar-context';
 *
 * const ctx = createCalendarContext(db, userId, encryptionKey);
 *
 * const settings: SetupSettings = {
 *   provider: 'claude',
 *   apiKey: 'sk-ant-xxx',
 * };
 *
 * const result = await saveSetupSettings(ctx, settings);
 *
 * if (isOk(result)) {
 *   console.log('設定を保存しました');
 * } else {
 *   console.error(`エラー: [${result.error.code}] ${result.error.message}`);
 * }
 * ```
 */

import type { CalendarContext } from "@/lib/context/calendar-context";
import { err, isErr, ok } from "@/lib/domain/shared";
import type { Result } from "@/lib/domain/shared/result";
import {
	getSecretKeyForProvider,
	type SaveOptions,
	type SaveSettingsError,
	type SetupSettings,
} from "./types";

// ============================================================
// 定数
// ============================================================

/** Ollamaのデフォルトベースurl */
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

// ============================================================
// エラーファクトリ
// ============================================================

/**
 * 既存キーエラーを生成
 *
 * @returns KEY_EXISTSエラー
 */
function keyExistsError(): SaveSettingsError {
	return {
		code: "KEY_EXISTS",
		message:
			"既にAPIキーが設定されています。上書きする場合はoverwriteExistingをtrueに設定してください。",
	};
}

/**
 * シークレット保存エラーを生成
 *
 * @param cause - 元のエラー
 * @returns KEYCHAIN_ERRORエラー（後方互換のためコード名は維持）
 */
function secretStoreError(cause: unknown): SaveSettingsError {
	return {
		code: "KEYCHAIN_ERROR",
		message: "認証情報の保存に失敗しました。",
		cause,
	};
}

/**
 * 設定保存エラーを生成
 *
 * @param cause - 元のエラー
 * @returns CONFIG_ERRORエラー
 */
function configError(cause: unknown): SaveSettingsError {
	return {
		code: "CONFIG_ERROR",
		message: "設定の保存に失敗しました。",
		cause,
	};
}

// ============================================================
// メイン関数
// ============================================================

/**
 * セットアップ設定を保存
 *
 * セットアップ設定を暗号化DBとD1設定テーブルに保存します。
 *
 * ## 処理フロー
 * 1. 既存APIキーの存在確認
 * 2. overwriteExisting=falseかつ存在する場合はKEY_EXISTSエラー
 * 3. 暗号化DBへの保存
 *    - Claude/OpenAI: apiKeyを保存
 *    - Ollama: baseUrlを保存（未指定の場合はデフォルト値）
 * 4. D1設定テーブルの更新（llm_providerを更新）
 *
 * ## セキュリティ
 * - APIキーは暗号化されてDBに保存され、設定テーブルには含まれません
 * - 入力されたapiKeyは参照渡しではなくコピーとして処理されます
 *
 * @param ctx - CalendarContext（依存性注入コンテナ）
 * @param settings - セットアップ設定
 * @param options - 保存オプション（オプション）
 * @returns 成功時はOk<void>、失敗時はErr<SaveSettingsError>
 *
 * @example
 * ```typescript
 * // Claude設定を保存
 * const result = await saveSetupSettings(ctx, {
 *   provider: 'claude',
 *   apiKey: 'sk-ant-xxx',
 * });
 *
 * // 既存キーを上書き
 * const overwriteResult = await saveSetupSettings(
 *   ctx,
 *   { provider: 'openai', apiKey: 'sk-xxx' },
 *   { overwriteExisting: true }
 * );
 *
 * // Ollama設定（APIキー不要）
 * const ollamaResult = await saveSetupSettings(ctx, {
 *   provider: 'ollama',
 *   baseUrl: 'http://localhost:11434',
 *   model: 'llama2',
 * });
 * ```
 */
export async function saveSetupSettings(
	ctx: CalendarContext,
	settings: SetupSettings,
	options: SaveOptions = {},
): Promise<Result<void, SaveSettingsError>> {
	const { provider, apiKey, baseUrl } = settings;
	const { overwriteExisting = false } = options;

	// プロバイダに対応するシークレットキーを取得
	const secretKey = getSecretKeyForProvider(provider);

	// ------------------------------------------------------------
	// 1. 既存APIキーの存在確認
	// ------------------------------------------------------------
	const hasKeyResult = await ctx.secretRepository.hasSecret(secretKey);
	if (isErr(hasKeyResult)) {
		return err(secretStoreError(hasKeyResult.error));
	}

	// overwriteExisting=falseかつ既存キーがある場合はエラー
	if (hasKeyResult.value && !overwriteExisting) {
		return err(keyExistsError());
	}

	// ------------------------------------------------------------
	// 2. 暗号化DBへの保存
	// ------------------------------------------------------------
	// 保存する値を決定（参照ではなくコピーを使用）
	const secretValue: string | undefined =
		provider === "ollama"
			? // Ollamaの場合はbaseUrlを保存（未指定の場合はデフォルト値）
				(baseUrl ?? DEFAULT_OLLAMA_BASE_URL)
			: // Claude/OpenAIの場合はapiKeyを保存
				apiKey;

	// シークレット値が存在する場合のみ保存
	if (secretValue !== undefined) {
		const setResult = await ctx.secretRepository.setSecret(
			secretKey,
			secretValue,
		);
		if (isErr(setResult)) {
			return err(secretStoreError(setResult.error));
		}
	}

	// ------------------------------------------------------------
	// 3. D1設定テーブルの更新
	// ------------------------------------------------------------
	const saveResult = await ctx.configRepository.setSetting(
		"llm_provider",
		provider,
	);
	if (isErr(saveResult)) {
		return err(configError(saveResult.error));
	}

	return ok(undefined);
}
