/**
 * シークレット管理モジュール公開API
 *
 * SQLite暗号化ストレージを使用したシークレット管理機能を提供します。
 * keytar-adapter.tsと同一インターフェースで、AES-256-GCM暗号化により
 * シークレットを安全に保存します。
 *
 * @module lib/infrastructure/secret
 * @example
 * ```typescript
 * import {
 *   getSecret,
 *   setSecret,
 *   deleteSecret,
 *   hasSecret,
 *   getSecrets,
 *   type SecretKey,
 *   type SecretError,
 * } from '@/lib/infrastructure/secret';
 * import { isOk, isSome } from '@/lib/domain/shared';
 *
 * // シークレットの保存
 * const result = await setSecret('anthropic-api-key', 'sk-xxx');
 * if (isOk(result)) {
 *   console.log('保存成功');
 * }
 *
 * // シークレットの取得
 * const getResult = await getSecret('anthropic-api-key');
 * if (isOk(getResult) && isSome(getResult.value)) {
 *   console.log('取得成功');
 * }
 * ```
 */

// ============================================================
// シークレットリポジトリ関数
// ============================================================

export {
	/** SQLiteからシークレットを削除 */
	deleteSecret,
	/** SQLiteからシークレットを取得 */
	getSecret,
	/** 複数のシークレットを一括で取得 */
	getSecrets,
	/** シークレットの存在確認 */
	hasSecret,
	/** SQLiteにシークレットを保存 */
	setSecret,
} from "./secret-repository";

// ============================================================
// 型定義
// ============================================================

export type {
	/** Google OAuth用シークレットキー（動的） */
	GoogleOAuthSecretKey,
	/** LLMプロバイダ用シークレットキー */
	LLMSecretKey,
	/** シークレットエラー */
	SecretError,
	/** シークレットエラーコード */
	SecretErrorCode,
	/** 全シークレットキー */
	SecretKey,
	/** シークレット固有のエラーコード */
	SecretOwnErrorCode,
} from "./types";

export {
	/** メールアドレスからGoogleOAuthSecretKeyを生成 */
	createGoogleOAuthKey,
	/** GoogleOAuthSecretKeyからメールアドレスを抽出 */
	extractEmailFromGoogleOAuthKey,
	/** GoogleOAuthSecretKeyかどうかを判定 */
	isGoogleOAuthKey,
	/** LLMSecretKeyかどうかを判定 */
	isLLMSecretKey,
	/** SecretErrorかどうかを判定 */
	isSecretError,
	/** SecretKeyかどうかを判定 */
	isSecretKey,
	/** LLMシークレットキーの説明 */
	LLM_SECRET_KEY_DESCRIPTIONS,
	/** 有効なLLMシークレットキーの一覧 */
	LLM_SECRET_KEYS,
	/** シークレット削除エラーを生成 */
	secretDeleteFailed,
	/** シークレット未検出エラーを生成 */
	secretNotFound,
	/** シークレット読み込みエラーを生成 */
	secretReadFailed,
	/** シークレット書き込みエラーを生成 */
	secretWriteFailed,
} from "./types";
