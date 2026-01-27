/**
 * 暗号化モジュール公開API
 *
 * AES-256-GCM暗号化機能を提供するモジュールのエントリーポイントです。
 * 暗号化・復号化関数と関連する型・定数をエクスポートします。
 *
 * @module lib/infrastructure/crypto
 * @example
 * ```typescript
 * import {
 *   encrypt,
 *   decrypt,
 *   getEncryptionKey,
 *   serialize,
 *   deserialize,
 *   isCryptoError,
 *   CRYPTO_CONSTANTS,
 * } from '@/lib/infrastructure/crypto';
 * import { isOk } from '@/lib/domain/shared/result';
 *
 * // 暗号化キーを取得
 * const keyResult = getEncryptionKey();
 * if (!isOk(keyResult)) {
 *   console.error(keyResult.error.message);
 *   process.exit(1);
 * }
 *
 * // データを暗号化
 * const encryptResult = encrypt('機密データ', keyResult.value);
 * if (isOk(encryptResult)) {
 *   // シリアライズしてDB保存
 *   const serialized = serialize(encryptResult.value);
 *   // ...DBに保存
 * }
 * ```
 */

// encryption.ts から関数をエクスポート
export {
	decrypt,
	deserialize,
	encrypt,
	getEncryptionKey,
	serialize,
} from "./encryption";
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
