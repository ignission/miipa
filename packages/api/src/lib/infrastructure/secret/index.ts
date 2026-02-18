/**
 * シークレット管理モジュール公開API
 *
 * D1データベースを使用したマルチテナント対応の暗号化シークレット管理機能を提供します。
 * Web Crypto API（AES-256-GCM）で暗号化し、ユーザーごとにシークレットを分離管理します。
 *
 * @module lib/infrastructure/secret
 * @example
 * ```typescript
 * import {
 *   D1SecretRepository,
 *   type SecretKey,
 *   type SecretError,
 * } from '@/lib/infrastructure/secret';
 *
 * const repo = new D1SecretRepository(env.DB, userId, encryptionKey);
 *
 * // シークレットの保存
 * const result = await repo.setSecret('anthropic-api-key', 'sk-xxx');
 *
 * // シークレットの取得
 * const getResult = await repo.getSecret('anthropic-api-key');
 * ```
 */

// ============================================================
// D1SecretRepository
// ============================================================

export { D1SecretRepository } from "./d1-secret-repository";

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
