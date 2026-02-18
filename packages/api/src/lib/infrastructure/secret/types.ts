/**
 * シークレットリポジトリ型定義モジュール
 *
 * シークレット管理で使用するキー型、エラー型、型ガード関数を定義します。
 * LLMプロバイダのAPIキーとGoogle OAuthトークン（複数アカウント対応）を
 * 型安全に管理するための型定義を提供します。
 *
 * @module lib/infrastructure/secret/types
 * @example
 * ```typescript
 * import type { SecretKey, SecretError } from '@/lib/infrastructure/secret/types';
 * import { secretNotFound, isGoogleOAuthKey } from '@/lib/infrastructure/secret/types';
 *
 * // LLMシークレットキーの使用
 * const key: SecretKey = 'anthropic-api-key';
 *
 * // Google OAuthキー（動的生成）
 * const oauthKey: SecretKey = 'google-oauth-user@example.com';
 * if (isGoogleOAuthKey(oauthKey)) {
 *   // oauthKey は GoogleOAuthSecretKey 型に絞り込まれる
 * }
 *
 * // エラーファクトリの使用
 * const error = secretNotFound('anthropic-api-key', 'APIキーが見つかりません');
 * ```
 */

import type { AppError } from "@/lib/domain/shared/errors";
import type { CryptoErrorCode } from "@/lib/infrastructure/crypto/types";

// ============================================================
// シークレットキー型定義
// ============================================================

/**
 * LLMプロバイダ関連のAPIキー
 *
 * 各LLMプロバイダのAPIキーを識別するための型。
 * 既存のkeychain/types.tsと互換性を維持します。
 */
export type LLMSecretKey =
	| "anthropic-api-key"
	| "openai-api-key"
	| "ollama-api-key"
	| "gemini-api-key";

/**
 * 動的Google OAuthシークレットキー
 *
 * 複数Googleアカウント対応のため、アカウントメールアドレスごとに
 * 動的にキーを生成するテンプレートリテラル型。
 *
 * @example
 * ```typescript
 * const key: GoogleOAuthSecretKey = 'google-oauth-user@example.com';
 * const key2: GoogleOAuthSecretKey = 'google-oauth-work@company.co.jp';
 * ```
 */
export type GoogleOAuthSecretKey = `google-oauth-${string}`;

/**
 * 全シークレットキー
 *
 * アプリケーションで管理するすべてのシークレットキーを定義するunion型。
 * LLMプロバイダのAPIキーと動的Google OAuthキーを含みます。
 *
 * @example
 * ```typescript
 * // 静的キー
 * const llmKey: SecretKey = 'anthropic-api-key';
 *
 * // 動的キー（Google OAuth）
 * const oauthKey: SecretKey = 'google-oauth-user@example.com';
 * ```
 */
export type SecretKey = LLMSecretKey | GoogleOAuthSecretKey;

// ============================================================
// LLMシークレットキー一覧
// ============================================================

/**
 * 有効なLLMシークレットキーの一覧
 *
 * 型ガードや検証で使用するための配列。
 * LLMSecretKey型と同期を保つ必要があります。
 */
export const LLM_SECRET_KEYS: readonly LLMSecretKey[] = [
	"anthropic-api-key",
	"openai-api-key",
	"ollama-api-key",
	"gemini-api-key",
] as const;

/**
 * LLMシークレットキーの説明（日本語）
 *
 * エラーメッセージやUIで使用するための説明文。
 */
export const LLM_SECRET_KEY_DESCRIPTIONS: Record<LLMSecretKey, string> = {
	"anthropic-api-key": "Anthropic APIキー（Claude用）",
	"openai-api-key": "OpenAI APIキー（GPT用）",
	"ollama-api-key": "Ollama APIキー（ローカルLLM用）",
	"gemini-api-key": "Google AI APIキー（Gemini用）",
};

// ============================================================
// シークレットエラー型定義
// ============================================================

/**
 * シークレット固有のエラーコード
 *
 * シークレット管理で発生する可能性のあるエラーを識別するためのリテラル型。
 */
export type SecretOwnErrorCode =
	| "SECRET_NOT_FOUND"
	| "SECRET_WRITE_FAILED"
	| "SECRET_DELETE_FAILED"
	| "SECRET_READ_FAILED";

/**
 * シークレットエラーコード
 *
 * シークレット固有のエラーコードとCryptoErrorCodeを組み合わせたunion型。
 * 暗号化・復号化エラーもシークレットエラーとして扱えます。
 *
 * @example
 * ```typescript
 * const code: SecretErrorCode = 'SECRET_NOT_FOUND';
 * const cryptoCode: SecretErrorCode = 'ENCRYPTION_FAILED';
 * ```
 */
export type SecretErrorCode = SecretOwnErrorCode | CryptoErrorCode;

/**
 * シークレットエラー
 *
 * シークレットの読み書き・削除に関するエラーを表現します。
 * AppErrorを継承し、codeフィールドでエラー種別を識別できます。
 * keyフィールドでどのシークレットに関するエラーかを特定できます。
 *
 * @example
 * ```typescript
 * const error: SecretError = {
 *   code: 'SECRET_NOT_FOUND',
 *   message: 'APIキーが見つかりません',
 *   key: 'anthropic-api-key',
 * };
 *
 * // Result型との組み合わせ
 * function getSecret(key: SecretKey): Result<string, SecretError> {
 *   const value = repository.get(key);
 *   if (!value) {
 *     return err(secretNotFound(key));
 *   }
 *   return ok(value);
 * }
 * ```
 */
export interface SecretError extends AppError {
	/** シークレットエラーコード */
	readonly code: SecretErrorCode;
	/** 対象のシークレットキー（オプション） */
	readonly key?: string;
}

// ============================================================
// エラーファクトリ関数
// ============================================================

/**
 * シークレット未検出エラーを生成
 *
 * 指定したキーに対応するシークレットが見つからない場合に使用します。
 *
 * @param key - 対象のシークレットキー
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns SecretError
 *
 * @example
 * ```typescript
 * const value = repository.get(key);
 * if (!value) {
 *   return err(secretNotFound(key, `キー "${key}" のシークレットが見つかりません`));
 * }
 * ```
 */
export function secretNotFound(
	key: string,
	message?: string,
	cause?: unknown,
): SecretError {
	return {
		code: "SECRET_NOT_FOUND",
		message:
			message ??
			`シークレットが見つかりません。初期設定を行ってください: ${key}`,
		key,
		cause,
	} as const;
}

/**
 * シークレット書き込みエラーを生成
 *
 * シークレットの保存に失敗した場合に使用します。
 *
 * @param key - 対象のシークレットキー
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns SecretError
 *
 * @example
 * ```typescript
 * try {
 *   await repository.set(key, value);
 * } catch (e) {
 *   return err(secretWriteFailed(key, 'シークレットの保存に失敗しました', e));
 * }
 * ```
 */
export function secretWriteFailed(
	key: string,
	message?: string,
	cause?: unknown,
): SecretError {
	return {
		code: "SECRET_WRITE_FAILED",
		message: message ?? `シークレットの保存に失敗しました: ${key}`,
		key,
		cause,
	} as const;
}

/**
 * シークレット削除エラーを生成
 *
 * シークレットの削除に失敗した場合に使用します。
 *
 * @param key - 対象のシークレットキー
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns SecretError
 *
 * @example
 * ```typescript
 * try {
 *   await repository.delete(key);
 * } catch (e) {
 *   return err(secretDeleteFailed(key, 'シークレットの削除に失敗しました', e));
 * }
 * ```
 */
export function secretDeleteFailed(
	key: string,
	message?: string,
	cause?: unknown,
): SecretError {
	return {
		code: "SECRET_DELETE_FAILED",
		message: message ?? `シークレットの削除に失敗しました: ${key}`,
		key,
		cause,
	} as const;
}

/**
 * シークレット読み込みエラーを生成
 *
 * シークレットの読み込み（取得）に失敗した場合に使用します。
 * 暗号化されたシークレットの復号化失敗などに使用します。
 *
 * @param key - 対象のシークレットキー
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns SecretError
 *
 * @example
 * ```typescript
 * try {
 *   const decrypted = await decrypt(encryptedValue);
 * } catch (e) {
 *   return err(secretReadFailed(key, 'シークレットの復号化に失敗しました', e));
 * }
 * ```
 */
export function secretReadFailed(
	key: string,
	message?: string,
	cause?: unknown,
): SecretError {
	return {
		code: "SECRET_READ_FAILED",
		message: message ?? `シークレットの読み込みに失敗しました: ${key}`,
		key,
		cause,
	} as const;
}

// ============================================================
// 型ガード
// ============================================================

/**
 * シークレット固有のエラーコード一覧
 *
 * 型ガードで使用するための配列。
 */
const SECRET_OWN_ERROR_CODES: readonly SecretOwnErrorCode[] = [
	"SECRET_NOT_FOUND",
	"SECRET_WRITE_FAILED",
	"SECRET_DELETE_FAILED",
	"SECRET_READ_FAILED",
] as const;

/**
 * CryptoErrorCode一覧
 *
 * 型ガードで使用するための配列。
 */
const CRYPTO_ERROR_CODES: readonly CryptoErrorCode[] = [
	"ENCRYPTION_KEY_MISSING",
	"ENCRYPTION_KEY_INVALID",
	"ENCRYPTION_FAILED",
	"DECRYPTION_FAILED",
] as const;

/**
 * SecretErrorかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns SecretErrorの場合true
 *
 * @example
 * ```typescript
 * if (isSecretError(error)) {
 *   // error は SecretError 型に絞り込まれる
 *   switch (error.code) {
 *     case 'SECRET_NOT_FOUND':
 *       console.error(`シークレット "${error.key}" が見つかりません`);
 *       break;
 *     case 'ENCRYPTION_FAILED':
 *       console.error('暗号化に失敗しました');
 *       break;
 *   }
 * }
 * ```
 */
export function isSecretError(error: AppError): error is SecretError {
	return (
		(SECRET_OWN_ERROR_CODES as readonly string[]).includes(error.code) ||
		(CRYPTO_ERROR_CODES as readonly string[]).includes(error.code)
	);
}

/**
 * LLMSecretKeyかどうかを判定
 *
 * @param key - 判定対象のキー
 * @returns LLMSecretKeyの場合true
 *
 * @example
 * ```typescript
 * const key = 'anthropic-api-key';
 * if (isLLMSecretKey(key)) {
 *   // key は LLMSecretKey 型に絞り込まれる
 *   const description = LLM_SECRET_KEY_DESCRIPTIONS[key];
 * }
 * ```
 */
export function isLLMSecretKey(key: string): key is LLMSecretKey {
	return (LLM_SECRET_KEYS as readonly string[]).includes(key);
}

/**
 * Google OAuthキープレフィックス
 */
const GOOGLE_OAUTH_PREFIX = "google-oauth-";

/**
 * GoogleOAuthSecretKeyかどうかを判定
 *
 * google-oauth-で始まるキーをGoogleOAuthSecretKeyとして判定します。
 * メールアドレス部分の形式チェックは行いません（柔軟性を優先）。
 *
 * @param key - 判定対象のキー
 * @returns GoogleOAuthSecretKeyの場合true
 *
 * @example
 * ```typescript
 * const key = 'google-oauth-user@example.com';
 * if (isGoogleOAuthKey(key)) {
 *   // key は GoogleOAuthSecretKey 型に絞り込まれる
 *   const email = key.replace('google-oauth-', '');
 * }
 * ```
 */
export function isGoogleOAuthKey(key: string): key is GoogleOAuthSecretKey {
	return (
		key.startsWith(GOOGLE_OAUTH_PREFIX) &&
		key.length > GOOGLE_OAUTH_PREFIX.length
	);
}

/**
 * SecretKeyかどうかを判定
 *
 * LLMSecretKeyまたはGoogleOAuthSecretKeyのいずれかに該当するかを判定します。
 *
 * @param key - 判定対象のキー
 * @returns SecretKeyの場合true
 *
 * @example
 * ```typescript
 * const input = 'anthropic-api-key';
 * if (isSecretKey(input)) {
 *   // input は SecretKey 型に絞り込まれる
 *   await repository.get(input);
 * }
 * ```
 */
export function isSecretKey(key: string): key is SecretKey {
	return isLLMSecretKey(key) || isGoogleOAuthKey(key);
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * メールアドレスからGoogleOAuthSecretKeyを生成
 *
 * @param email - Googleアカウントのメールアドレス
 * @returns GoogleOAuthSecretKey
 *
 * @example
 * ```typescript
 * const key = createGoogleOAuthKey('user@example.com');
 * // key = 'google-oauth-user@example.com'
 * ```
 */
export function createGoogleOAuthKey(email: string): GoogleOAuthSecretKey {
	return `${GOOGLE_OAUTH_PREFIX}${email}`;
}

/**
 * GoogleOAuthSecretKeyからメールアドレスを抽出
 *
 * @param key - GoogleOAuthSecretKey
 * @returns メールアドレス
 *
 * @example
 * ```typescript
 * const email = extractEmailFromGoogleOAuthKey('google-oauth-user@example.com');
 * // email = 'user@example.com'
 * ```
 */
export function extractEmailFromGoogleOAuthKey(
	key: GoogleOAuthSecretKey,
): string {
	return key.slice(GOOGLE_OAUTH_PREFIX.length);
}
