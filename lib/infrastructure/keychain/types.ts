/**
 * Keychain 型定義モジュール
 *
 * macOS Keychainで管理するシークレットのキー型と関連型を定義します。
 * 型安全なシークレット管理を実現するためのunion型を提供します。
 *
 * @module lib/infrastructure/keychain/types
 * @example
 * ```typescript
 * import type { SecretKey } from '@/lib/infrastructure/keychain/types';
 *
 * const key: SecretKey = 'anthropic-api-key';
 * ```
 */

// ============================================================
// Keychainサービス設定
// ============================================================

/**
 * Keychainで使用するサービス名
 *
 * macOS Keychainでアプリケーションを識別するための一意の識別子。
 * reverse-domain形式を使用しています。
 */
export const KEYCHAIN_SERVICE = "com.soloday.app" as const;

// ============================================================
// シークレットキー型定義
// ============================================================

/**
 * LLMプロバイダ関連のAPIキー
 *
 * 各LLMプロバイダのAPIキーを識別するための型。
 */
export type LLMSecretKey =
	| "anthropic-api-key"
	| "openai-api-key"
	| "ollama-api-key"
	| "gemini-api-key";

/**
 * OAuth関連のトークン
 *
 * Google Calendar OAuthなどの認証トークンを識別するための型。
 */
export type OAuthSecretKey =
	| "google-oauth-access-token"
	| "google-oauth-refresh-token";

/**
 * Keychainで管理するシークレットのキー
 *
 * アプリケーションで使用するすべてのシークレットキーを定義するunion型。
 * このキーを使用してKeychainからシークレットを取得・保存・削除します。
 *
 * @example
 * ```typescript
 * const key: SecretKey = 'anthropic-api-key';
 * const result = await getSecret(key);
 * ```
 */
export type SecretKey = LLMSecretKey | OAuthSecretKey;

// ============================================================
// シークレットキー一覧
// ============================================================

/**
 * 有効なシークレットキーの一覧
 *
 * 型ガードや検証で使用するための配列。
 * SecretKey型と同期を保つ必要があります。
 */
export const SECRET_KEYS: readonly SecretKey[] = [
	// LLMプロバイダ
	"anthropic-api-key",
	"openai-api-key",
	"ollama-api-key",
	"gemini-api-key",
	// OAuth
	"google-oauth-access-token",
	"google-oauth-refresh-token",
] as const;

// ============================================================
// 型ガード
// ============================================================

/**
 * 文字列がSecretKeyかどうかを判定
 *
 * @param value - 判定対象の値
 * @returns SecretKeyの場合true
 *
 * @example
 * ```typescript
 * const input = 'anthropic-api-key';
 * if (isSecretKey(input)) {
 *   // input は SecretKey 型に絞り込まれる
 *   await getSecret(input);
 * }
 * ```
 */
export function isSecretKey(value: string): value is SecretKey {
	return SECRET_KEYS.includes(value as SecretKey);
}

// ============================================================
// シークレット説明
// ============================================================

/**
 * シークレットキーの説明（日本語）
 *
 * エラーメッセージやUIで使用するための説明文。
 */
export const SECRET_KEY_DESCRIPTIONS: Record<SecretKey, string> = {
	"anthropic-api-key": "Anthropic APIキー（Claude用）",
	"openai-api-key": "OpenAI APIキー（GPT用）",
	"ollama-api-key": "Ollama APIキー（ローカルLLM用）",
	"gemini-api-key": "Google AI APIキー（Gemini用）",
	"google-oauth-access-token": "Google OAuthアクセストークン",
	"google-oauth-refresh-token": "Google OAuthリフレッシュトークン",
};
