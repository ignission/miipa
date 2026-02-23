/**
 * 暗号化モジュール型定義
 *
 * AES-256-GCM暗号化で使用する型とエラーファクトリ関数を定義します。
 * 既存のエラーパターンに従い、discriminated unionによる
 * 型安全なエラーハンドリングを実現します。
 *
 * @module lib/infrastructure/crypto/types
 * @example
 * ```typescript
 * import type { CryptoError } from '@/lib/infrastructure/crypto/types';
 * import { encryptionFailed } from '@/lib/infrastructure/crypto/types';
 *
 * // エラーファクトリの使用
 * const error: CryptoError = encryptionFailed('暗号化処理でエラーが発生しました');
 * ```
 */

import type { AppError } from "@/lib/domain/shared/errors";

// ============================================================
// エラーコード型定義
// ============================================================

/**
 * 暗号化エラーコードの型定義
 *
 * 暗号化・復号化処理で発生する可能性のあるエラーを識別するためのリテラル型。
 * discriminated unionパターンにより、型安全なエラーハンドリングを実現します。
 *
 * @example
 * ```typescript
 * const code: CryptoErrorCode = 'ENCRYPTION_FAILED';
 * switch (code) {
 *   case 'ENCRYPTION_KEY_MISSING':
 *     // 環境変数の設定を促す
 *     break;
 *   case 'ENCRYPTION_KEY_INVALID':
 *     // キー長の確認を促す
 *     break;
 *   case 'ENCRYPTION_FAILED':
 *     // 暗号化エラーの処理
 *     break;
 *   case 'DECRYPTION_FAILED':
 *     // 復号化エラーの処理
 *     break;
 * }
 * ```
 */
export type CryptoErrorCode =
	| "ENCRYPTION_KEY_MISSING" // 環境変数未設定
	| "ENCRYPTION_KEY_INVALID" // キー長不正（32バイト以外）
	| "ENCRYPTION_FAILED" // 暗号化処理失敗
	| "DECRYPTION_FAILED"; // 復号化処理失敗

// ============================================================
// エラー型定義
// ============================================================

/**
 * 暗号化エラー
 *
 * AES-256-GCM暗号化・復号化処理に関するエラーを表現します。
 * AppErrorを継承し、codeフィールドでエラー種別を識別できます。
 *
 * @example
 * ```typescript
 * const error: CryptoError = {
 *   code: 'ENCRYPTION_KEY_MISSING',
 *   message: '暗号化キーが設定されていません',
 * };
 *
 * // Result型との組み合わせ
 * function encrypt(data: string): Result<EncryptedData, CryptoError> {
 *   if (!process.env.MIIPA_ENCRYPTION_KEY) {
 *     return err(encryptionKeyMissing());
 *   }
 *   // ...
 * }
 * ```
 */
export interface CryptoError extends AppError {
	/** 暗号化エラーコード */
	readonly code: CryptoErrorCode;
}

// ============================================================
// エラーファクトリ関数
// ============================================================

/**
 * 暗号化キー未設定エラーを生成
 *
 * 環境変数 MIIPA_ENCRYPTION_KEY が設定されていない場合に使用します。
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns CryptoError
 *
 * @example
 * ```typescript
 * if (!process.env.MIIPA_ENCRYPTION_KEY) {
 *   return err(encryptionKeyMissing());
 * }
 * ```
 */
function _encryptionKeyMissing(message?: string, cause?: unknown): CryptoError {
	return {
		code: "ENCRYPTION_KEY_MISSING",
		message:
			message ??
			"暗号化キーが設定されていません。環境変数 MIIPA_ENCRYPTION_KEY を設定してください。",
		cause,
	} as const;
}

/**
 * 暗号化キー不正エラーを生成
 *
 * 暗号化キーの長さが32バイト（AES-256の要件）でない場合に使用します。
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因
 * @returns CryptoError
 *
 * @example
 * ```typescript
 * const key = Buffer.from(process.env.MIIPA_ENCRYPTION_KEY, 'base64');
 * if (key.length !== 32) {
 *   return err(encryptionKeyInvalid(`キー長が不正です: ${key.length}バイト（32バイト必要）`));
 * }
 * ```
 */
export function encryptionKeyInvalid(
	message?: string,
	cause?: unknown,
): CryptoError {
	return {
		code: "ENCRYPTION_KEY_INVALID",
		message:
			message ??
			"暗号化キーの形式が不正です。32バイトのBase64エンコード文字列を設定してください。",
		cause,
	} as const;
}

/**
 * 暗号化失敗エラーを生成
 *
 * AES-256-GCM暗号化処理中にエラーが発生した場合に使用します。
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因（通常はcryptoモジュールのエラー）
 * @returns CryptoError
 *
 * @example
 * ```typescript
 * try {
 *   const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
 *   // ...
 * } catch (e) {
 *   return err(encryptionFailed('暗号化処理でエラーが発生しました', e));
 * }
 * ```
 */
export function encryptionFailed(
	message?: string,
	cause?: unknown,
): CryptoError {
	return {
		code: "ENCRYPTION_FAILED",
		message: message ?? "暗号化処理に失敗しました",
		cause,
	} as const;
}

/**
 * 復号化失敗エラーを生成
 *
 * AES-256-GCM復号化処理中にエラーが発生した場合に使用します。
 * 認証タグの検証失敗（データ改ざん検出）もこのエラーに含まれます。
 *
 * @param message - エラーメッセージ
 * @param cause - エラーの原因（通常はcryptoモジュールのエラー）
 * @returns CryptoError
 *
 * @example
 * ```typescript
 * try {
 *   const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
 *   decipher.setAuthTag(authTag);
 *   // ...
 * } catch (e) {
 *   return err(decryptionFailed('復号化に失敗しました。データが破損している可能性があります', e));
 * }
 * ```
 */
export function decryptionFailed(
	message?: string,
	cause?: unknown,
): CryptoError {
	return {
		code: "DECRYPTION_FAILED",
		message: message ?? "復号化処理に失敗しました",
		cause,
	} as const;
}

// ============================================================
// 型ガード
// ============================================================

/**
 * CryptoErrorかどうかを判定
 *
 * @param error - 判定対象のエラー
 * @returns CryptoErrorの場合true
 *
 * @example
 * ```typescript
 * if (isCryptoError(error)) {
 *   // error は CryptoError 型に絞り込まれる
 *   switch (error.code) {
 *     case 'ENCRYPTION_KEY_MISSING':
 *       console.error('環境変数を設定してください');
 *       break;
 *     case 'DECRYPTION_FAILED':
 *       console.error('データが破損している可能性があります');
 *       break;
 *   }
 * }
 * ```
 */
function _isCryptoError(error: AppError): error is CryptoError {
	return (
		error.code === "ENCRYPTION_KEY_MISSING" ||
		error.code === "ENCRYPTION_KEY_INVALID" ||
		error.code === "ENCRYPTION_FAILED" ||
		error.code === "DECRYPTION_FAILED"
	);
}

// ============================================================
// 定数
// ============================================================

/**
 * AES-256-GCM暗号化の設定値
 *
 * 暗号化処理で使用する固定値を定義します。
 */
export const CRYPTO_CONSTANTS = {
	/** 暗号化アルゴリズム */
	ALGORITHM: "aes-256-gcm",
	/** 初期化ベクトルのバイト長 */
	IV_LENGTH: 12,
	/** 認証タグのバイト長 */
	AUTH_TAG_LENGTH: 16,
	/** 暗号化キーのバイト長 */
	KEY_LENGTH: 32,
	/** 環境変数名 */
	ENV_KEY_NAME: "MIIPA_ENCRYPTION_KEY",
} as const;
