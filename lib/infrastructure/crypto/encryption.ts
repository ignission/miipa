/**
 * AES-256-GCM暗号化・復号化モジュール
 *
 * Node.js組み込みのcryptoモジュールを使用したAES-256-GCM暗号化を実装します。
 * 環境変数からの暗号化キー取得、暗号化・復号化、シリアライズ・デシリアライズの
 * 各機能を純粋関数として提供します。
 *
 * セキュリティ上の注意:
 * - 平文やキーをログに出力しないこと
 * - 暗号化キーは環境変数で管理（平文ファイル保存禁止）
 * - IVは暗号化ごとにランダム生成
 *
 * @module lib/infrastructure/crypto/encryption
 * @example
 * ```typescript
 * import { getEncryptionKey, encrypt, decrypt, serialize, deserialize } from '@/lib/infrastructure/crypto/encryption';
 * import { isOk, unwrap } from '@/lib/domain/shared/result';
 *
 * // 暗号化キーを取得
 * const keyResult = getEncryptionKey();
 * if (!isOk(keyResult)) {
 *   console.error(keyResult.error.message);
 *   process.exit(1);
 * }
 * const key = keyResult.value;
 *
 * // 暗号化
 * const encryptResult = encrypt('機密データ', key);
 * if (!isOk(encryptResult)) {
 *   console.error(encryptResult.error.message);
 *   process.exit(1);
 * }
 *
 * // シリアライズしてDB保存
 * const serialized = serialize(encryptResult.value);
 *
 * // デシリアライズして復号化
 * const deserialized = deserialize(serialized);
 * const decryptResult = decrypt(deserialized, key);
 * if (isOk(decryptResult)) {
 *   console.log(decryptResult.value); // '機密データ'
 * }
 * ```
 */

import crypto from "node:crypto";

import { err, ok, type Result } from "@/lib/domain/shared/result";

import {
	CRYPTO_CONSTANTS,
	type CryptoError,
	decryptionFailed,
	type EncryptedData,
	encryptionFailed,
	encryptionKeyInvalid,
	encryptionKeyMissing,
} from "./types";

// ============================================================
// 暗号化キー取得
// ============================================================

/**
 * 環境変数から暗号化キーを取得
 *
 * SOLODAY_ENCRYPTION_KEY環境変数からBase64エンコードされた暗号化キーを読み取り、
 * 32バイトのBufferにデコードして返します。
 *
 * @returns 成功時は32バイトのBuffer、失敗時はCryptoError
 *
 * @example
 * ```typescript
 * // 環境変数の設定例
 * // export SOLODAY_ENCRYPTION_KEY=$(openssl rand -base64 32)
 *
 * const result = getEncryptionKey();
 * if (isOk(result)) {
 *   const key = result.value;
 *   // key は 32 バイトの Buffer
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function getEncryptionKey(): Result<Buffer, CryptoError> {
	const base64Key = process.env[CRYPTO_CONSTANTS.ENV_KEY_NAME];

	// 環境変数未設定チェック
	if (!base64Key) {
		return err(
			encryptionKeyMissing(
				`暗号化キーが設定されていません。環境変数 ${CRYPTO_CONSTANTS.ENV_KEY_NAME} を設定してください。\n` +
					"キーは次のコマンドで生成できます: openssl rand -base64 32",
			),
		);
	}

	// Base64デコード
	let key: Buffer;
	try {
		key = Buffer.from(base64Key, "base64");
	} catch (e) {
		return err(
			encryptionKeyInvalid(
				`暗号化キーのBase64デコードに失敗しました。正しいBase64形式で設定してください。\n` +
					"キーは次のコマンドで生成できます: openssl rand -base64 32",
				e,
			),
		);
	}

	// キー長検証（32バイト必須）
	if (key.length !== CRYPTO_CONSTANTS.KEY_LENGTH) {
		return err(
			encryptionKeyInvalid(
				`暗号化キーの長さが不正です: ${key.length}バイト（${CRYPTO_CONSTANTS.KEY_LENGTH}バイト必要）\n` +
					"キーは次のコマンドで生成できます: openssl rand -base64 32",
			),
		);
	}

	return ok(key);
}

// ============================================================
// 暗号化
// ============================================================

/**
 * 文字列をAES-256-GCMで暗号化
 *
 * 指定された平文を暗号化し、EncryptedData構造体を返します。
 * IVはランダムに生成され、認証タグも自動的に計算されます。
 *
 * @param plaintext - 暗号化する平文
 * @param key - 32バイトの暗号化キー
 * @returns 成功時はEncryptedData、失敗時はCryptoError
 *
 * @example
 * ```typescript
 * const keyResult = getEncryptionKey();
 * if (!isOk(keyResult)) return;
 *
 * const result = encrypt('機密データ', keyResult.value);
 * if (isOk(result)) {
 *   const { iv, authTag, ciphertext } = result.value;
 *   // iv: 12バイト, authTag: 16バイト, ciphertext: 暗号文
 * }
 * ```
 */
export function encrypt(
	plaintext: string,
	key: Buffer,
): Result<EncryptedData, CryptoError> {
	try {
		// ランダムなIVを生成（12バイト）
		const iv = crypto.randomBytes(CRYPTO_CONSTANTS.IV_LENGTH);

		// 暗号化オブジェクトを生成
		const cipher = crypto.createCipheriv(
			CRYPTO_CONSTANTS.ALGORITHM,
			key,
			iv,
		) as crypto.CipherGCM;

		// 暗号化を実行
		const encrypted = Buffer.concat([
			cipher.update(plaintext, "utf8"),
			cipher.final(),
		]);

		// 認証タグを取得
		const authTag = cipher.getAuthTag();

		return ok({
			iv,
			authTag,
			ciphertext: encrypted,
		});
	} catch (e) {
		return err(encryptionFailed("暗号化処理中にエラーが発生しました", e));
	}
}

// ============================================================
// 復号化
// ============================================================

/**
 * AES-256-GCM暗号化データを復号化
 *
 * 暗号化されたデータを復号化し、元の平文を返します。
 * 認証タグによるデータ整合性検証も行われます。
 *
 * @param encrypted - 暗号化されたデータ
 * @param key - 32バイトの暗号化キー
 * @returns 成功時は平文、失敗時はCryptoError
 *
 * @example
 * ```typescript
 * const decryptResult = decrypt(encryptedData, key);
 * if (isOk(decryptResult)) {
 *   console.log(decryptResult.value); // 元の平文
 * } else {
 *   // 認証タグ検証失敗（改ざん検出）の可能性
 *   console.error('復号化に失敗しました');
 * }
 * ```
 */
export function decrypt(
	encrypted: EncryptedData,
	key: Buffer,
): Result<string, CryptoError> {
	try {
		// 復号化オブジェクトを生成
		const decipher = crypto.createDecipheriv(
			CRYPTO_CONSTANTS.ALGORITHM,
			key,
			encrypted.iv,
		) as crypto.DecipherGCM;

		// 認証タグを設定（改ざん検証用）
		decipher.setAuthTag(encrypted.authTag);

		// 復号化を実行
		const decrypted = Buffer.concat([
			decipher.update(encrypted.ciphertext),
			decipher.final(),
		]);

		return ok(decrypted.toString("utf8"));
	} catch (e) {
		return err(
			decryptionFailed(
				"復号化処理に失敗しました。データが破損しているか、キーが一致しない可能性があります",
				e,
			),
		);
	}
}

// ============================================================
// シリアライズ・デシリアライズ
// ============================================================

/**
 * 暗号化データをBase64文字列にシリアライズ（DB保存用）
 *
 * IV + AuthTag + Ciphertext を結合してBase64エンコードします。
 * 固定長のIVとAuthTagの後に可変長のCiphertextが続く形式です。
 *
 * フォーマット: [IV: 12bytes][AuthTag: 16bytes][Ciphertext: variable]
 *
 * @param data - 暗号化データ
 * @returns Base64エンコードされた文字列
 *
 * @example
 * ```typescript
 * const serialized = serialize(encryptedData);
 * // serialized: "Base64エンコードされた文字列"
 * // DBに保存可能
 * ```
 */
export function serialize(data: EncryptedData): string {
	// IV(12) + AuthTag(16) + Ciphertext を結合
	const combined = Buffer.concat([data.iv, data.authTag, data.ciphertext]);
	return combined.toString("base64");
}

/**
 * Base64文字列から暗号化データをデシリアライズ
 *
 * serialize関数で生成された文字列を元のEncryptedData構造体に復元します。
 *
 * @param base64 - Base64エンコードされた暗号化データ
 * @returns EncryptedData構造体
 * @throws Base64デコードに失敗した場合、またはデータ長が不足している場合
 *
 * @example
 * ```typescript
 * // DBから読み取った文字列をデシリアライズ
 * const data = deserialize(storedValue);
 * const result = decrypt(data, key);
 * ```
 */
export function deserialize(base64: string): EncryptedData {
	const combined = Buffer.from(base64, "base64");

	// IV(12バイト)を抽出
	const iv = combined.subarray(0, CRYPTO_CONSTANTS.IV_LENGTH);

	// AuthTag(16バイト)を抽出
	const authTag = combined.subarray(
		CRYPTO_CONSTANTS.IV_LENGTH,
		CRYPTO_CONSTANTS.IV_LENGTH + CRYPTO_CONSTANTS.AUTH_TAG_LENGTH,
	);

	// Ciphertext（残り）を抽出
	const ciphertext = combined.subarray(
		CRYPTO_CONSTANTS.IV_LENGTH + CRYPTO_CONSTANTS.AUTH_TAG_LENGTH,
	);

	return {
		iv,
		authTag,
		ciphertext,
	};
}
