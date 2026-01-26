/**
 * Keychain モジュール
 *
 * macOS Keychainを介した安全な認証情報管理機能を提供します。
 * keytarライブラリをラップし、Result型とOption型を使用した
 * 型安全なインターフェースを提供します。
 *
 * ## 機能
 *
 * - **シークレット管理**: APIキーやOAuthトークンの安全な保存・取得・削除
 * - **型安全**: SecretKey union型によるキーの型安全性
 * - **エラーハンドリング**: Result型による明示的なエラー処理
 * - **Option型サポート**: 存在しないシークレットの安全な処理
 *
 * ## セキュリティ
 *
 * - すべてのシークレットはmacOS Keychainに保存されます
 * - 平文ファイルへの保存は行いません
 * - アプリケーション固有のサービス名で管理されます
 *
 * @module lib/infrastructure/keychain
 * @example
 * ```typescript
 * import {
 *   getSecret,
 *   setSecret,
 *   deleteSecret,
 *   hasSecret,
 *   type SecretKey,
 * } from '@/lib/infrastructure/keychain';
 *
 * // APIキーを保存
 * await setSecret('anthropic-api-key', 'sk-xxx');
 *
 * // APIキーを取得
 * const result = await getSecret('anthropic-api-key');
 * if (isOk(result) && isSome(result.value)) {
 *   const apiKey = result.value.value;
 * }
 *
 * // APIキーを削除
 * await deleteSecret('anthropic-api-key');
 * ```
 */

// ============================================================
// 型定義のエクスポート
// ============================================================

/**
 * 型定義のエクスポート
 */
export type {
	/** LLMプロバイダ関連のAPIキー型 */
	LLMSecretKey,
	/** OAuth関連のトークン型 */
	OAuthSecretKey,
	/** Keychainで管理するシークレットのキー型 */
	SecretKey,
} from "./types";

export {
	/** 型ガード: 文字列がSecretKeyかどうかを判定 */
	isSecretKey,
	/** Keychainサービス名 */
	KEYCHAIN_SERVICE,
	/** シークレットキーの説明（日本語） */
	SECRET_KEY_DESCRIPTIONS,
	/** 有効なシークレットキーの一覧 */
	SECRET_KEYS,
} from "./types";

// ============================================================
// Keytar アダプター関数のエクスポート
// ============================================================

/**
 * シークレット操作関数のエクスポート
 */
export {
	/** Keychainからシークレットを削除 */
	deleteSecret,
	/** Keychainからシークレットを取得 */
	getSecret,
	/** 複数のシークレットを一括で取得 */
	getSecrets,
	/** シークレットの存在確認 */
	hasSecret,
	/** Keychainにシークレットを保存 */
	setSecret,
} from "./keytar-adapter";
