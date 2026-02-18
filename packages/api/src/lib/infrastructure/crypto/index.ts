/**
 * 暗号化モジュール公開API
 *
 * Web Crypto APIを使用したAES-256-GCM暗号化機能を提供するモジュールのエントリーポイントです。
 * Cloudflare Workers環境で動作する暗号化・復号化関数と関連する型・定数をエクスポートします。
 *
 * @module lib/infrastructure/crypto
 * @example
 * ```typescript
 * import {
 *   encrypt,
 *   decrypt,
 *   importEncryptionKey,
 *   isCryptoError,
 *   CRYPTO_CONSTANTS,
 * } from '@/lib/infrastructure/crypto';
 * import { isOk } from '@/lib/domain/shared/result';
 *
 * // 暗号化キーをインポート
 * const keyResult = await importEncryptionKey(keyBase64);
 * if (!isOk(keyResult)) {
 *   console.error(keyResult.error.message);
 * }
 *
 * // データを暗号化
 * const encryptResult = await encrypt('機密データ', keyResult.value);
 * if (isOk(encryptResult)) {
 *   // Base64文字列としてDB保存
 *   const encrypted = encryptResult.value;
 * }
 * ```
 */

export type {
	CryptoError,
	CryptoErrorCode,
	EncryptedData,
} from "./types";
// types.ts から型・定数・型ガードをエクスポート
export {
	CRYPTO_CONSTANTS,
	isCryptoError,
} from "./types";
// web-crypto-encryption.ts から関数をエクスポート
export { decrypt, encrypt, importEncryptionKey } from "./web-crypto-encryption";
