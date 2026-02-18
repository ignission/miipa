/**
 * 設定バリデーターモジュール
 *
 * miipaアプリケーションの設定データをバリデーションする機能を提供します。
 * Zodスキーマを使用したランタイムバリデーションを行い、
 * 結果はResult型で返されるため例外をスローしません。
 *
 * @module lib/config/validator
 *
 * @example
 * ```typescript
 * import { validateConfig, validatePartialConfig } from '@/lib/config/validator';
 * import { isOk, isErr } from '@/lib/domain/shared';
 *
 * // 完全な設定のバリデーション
 * const result = validateConfig(unknownData);
 * if (isOk(result)) {
 *   const config = result.value;
 *   console.log('LLMプロバイダ:', config.llm.provider);
 * } else {
 *   console.error(`[${result.error.code}] ${result.error.message}`);
 * }
 *
 * // 部分的な設定のバリデーション
 * const partialResult = validatePartialConfig({ ui: { theme: 'dark' } });
 * if (isOk(partialResult)) {
 *   // 部分設定をマージ
 * }
 * ```
 */

import { z } from "zod";

import {
	type ConfigError,
	configValidationError,
	err,
	ok,
	type Result,
} from "@/lib/domain/shared";

import { type AppConfig, AppConfigSchema } from "./types";

// ============================================================
// Zodエラー変換
// ============================================================

/**
 * Zod v4のissue型
 *
 * Zod v4ではZodIssueの構造が変更されているため、
 * 基本的なプロパティのみを使用します。
 */
interface ZodIssueBase {
	readonly path: readonly (string | number)[];
	readonly message: string;
	readonly code: string;
}

/**
 * Zodエラーの詳細メッセージを日本語に変換
 *
 * Zodの各エラーコードに対応する日本語メッセージを生成します。
 * Zod v4の新しいissue構造に対応しています。
 *
 * @param issue - Zodのエラーissue
 * @returns 日本語のエラーメッセージ
 */
function formatZodIssueMessage(issue: ZodIssueBase): string {
	const path = issue.path.length > 0 ? issue.path.join(".") : "(ルート)";

	// Zod v4のエラーコードに基づいてメッセージを生成
	switch (issue.code) {
		case "invalid_type":
			return `「${path}」の型が不正です: ${issue.message}`;
		case "invalid_value":
			return `「${path}」の値が不正です: ${issue.message}`;
		case "invalid_format":
			return `「${path}」の形式が不正です: ${issue.message}`;
		case "invalid_union":
			return `「${path}」はいずれの形式にも一致しません`;
		case "unrecognized_keys":
			return `「${path}」に認識できないキーが含まれています: ${issue.message}`;
		case "too_small":
			return `「${path}」が最小値を下回っています: ${issue.message}`;
		case "too_big":
			return `「${path}」が最大値を超えています: ${issue.message}`;
		case "not_multiple_of":
			return `「${path}」は指定された倍数ではありません: ${issue.message}`;
		case "invalid_key":
			return `「${path}」のキーが不正です: ${issue.message}`;
		case "invalid_element":
			return `「${path}」の要素が不正です: ${issue.message}`;
		case "custom":
			return issue.message || `「${path}」のバリデーションに失敗しました`;
		default:
			// Zodのデフォルトメッセージを使用（日本語化されていない場合はそのまま）
			return `「${path}」: ${issue.message}`;
	}
}

/**
 * ZodErrorをConfigErrorに変換
 *
 * 複数のエラーがある場合は、すべてのエラーメッセージを結合します。
 *
 * @param zodError - Zodのエラーオブジェクト
 * @returns ConfigError
 */
function zodErrorToConfigError(zodError: z.ZodError): ConfigError {
	const messages = zodError.issues.map((issue) =>
		formatZodIssueMessage(issue as ZodIssueBase),
	);

	const detailMessage = messages.join("\n");

	return configValidationError(
		`設定のバリデーションに失敗しました:\n${detailMessage}`,
		zodError,
	);
}

// ============================================================
// 部分スキーマ定義
// ============================================================

/**
 * 部分的な設定のためのスキーマ
 *
 * Zod v4ではdeepPartialが利用できない場合があるため、
 * 明示的に部分スキーマを定義します。
 */
const PartialAppConfigSchema = z
	.object({
		version: z.string().optional(),
		llm: z
			.object({
				provider: z.enum(["claude", "openai", "ollama"]).optional(),
				model: z.string().optional(),
				apiKeyRef: z.string().optional(),
				baseUrl: z.string().url().optional(),
			})
			.optional(),
		calendars: z
			.array(
				z.object({
					type: z.enum(["google", "ical"]).optional(),
					id: z.string().uuid().optional(),
					name: z.string().min(1).optional(),
					enabled: z.boolean().optional(),
					color: z
						.string()
						.regex(/^#[0-9A-Fa-f]{6}$/)
						.optional(),
					url: z.string().url().optional(),
					googleAccountId: z.string().optional(),
				}),
			)
			.optional(),
		ui: z
			.object({
				theme: z.enum(["light", "dark", "system"]).optional(),
				language: z.enum(["ja", "en"]).optional(),
			})
			.optional(),
	})
	.passthrough();

// ============================================================
// バリデーション関数
// ============================================================

/**
 * 任意のデータをAppConfigとしてバリデーション
 *
 * 未知のデータ（JSONパース結果など）を完全なAppConfigとしてバリデーションします。
 * Zodスキーマのデフォルト値が適用されるため、省略されたフィールドにはデフォルト値が設定されます。
 *
 * @param data - バリデーション対象のデータ
 * @returns 成功時はOk<AppConfig>、失敗時はErr<ConfigError>
 *
 * @remarks
 * - Zodスキーマのdefault値により、省略されたフィールドは自動的に補完されます
 * - 不正な値の場合は日本語の詳細なエラーメッセージが返されます
 *
 * @example
 * ```typescript
 * // JSONパース結果をバリデーション
 * const jsonData = JSON.parse(fileContent);
 * const result = validateConfig(jsonData);
 *
 * if (isOk(result)) {
 *   const config = result.value;
 *   // config.version, config.llm などすべてのフィールドが利用可能
 * } else {
 *   console.error(result.error.message);
 *   // "設定のバリデーションに失敗しました:
 *   //  「llm.provider」の値が不正です: ..."
 * }
 *
 * // 空オブジェクトも許可（デフォルト値が適用される）
 * const defaultResult = validateConfig({});
 * // defaultResult.value = DEFAULT_CONFIG と同等
 * ```
 */
export function validateConfig(data: unknown): Result<AppConfig, ConfigError> {
	const result = AppConfigSchema.safeParse(data);

	if (result.success) {
		return ok(result.data);
	}

	return err(zodErrorToConfigError(result.error));
}

/**
 * 部分的な設定データをバリデーション
 *
 * AppConfigの一部のフィールドのみを含むデータをバリデーションします。
 * 存在するフィールドのみがバリデーションされ、省略されたフィールドはundefinedのまま返されます。
 *
 * @param data - バリデーション対象の部分的なデータ
 * @returns 成功時はOk<Partial<AppConfig>>、失敗時はErr<ConfigError>
 *
 * @remarks
 * - 存在するフィールドに対してのみバリデーションが実行されます
 * - マージ用途で使用することを想定しています
 *
 * @example
 * ```typescript
 * // UIテーマのみを更新する場合
 * const partialData = { ui: { theme: 'dark' } };
 * const result = validatePartialConfig(partialData);
 *
 * if (isOk(result)) {
 *   // 部分設定を既存設定にマージ
 *   const newConfig = {
 *     ...currentConfig,
 *     ...result.value,
 *     ui: { ...currentConfig.ui, ...result.value.ui },
 *   };
 * }
 *
 * // 無効な値は拒否される
 * const invalid = { llm: { provider: 'invalid-provider' } };
 * const errorResult = validatePartialConfig(invalid);
 * // errorResult.error.message には詳細なエラーが含まれる
 * ```
 */
export function validatePartialConfig(
	data: unknown,
): Result<Partial<AppConfig>, ConfigError> {
	const result = PartialAppConfigSchema.safeParse(data);

	if (result.success) {
		return ok(result.data as Partial<AppConfig>);
	}

	return err(zodErrorToConfigError(result.error));
}
