/**
 * Web Crypto API暗号化・復号化モジュール
 *
 * Cloudflare Workers環境で動作するAES-256-GCM暗号化を実装します。
 * node:cryptoの代わりにWeb Crypto API（crypto.subtle）を使用し、
 * BufferではなくUint8Arrayを使用します。
 *
 * セキュリティ上の注意:
 * - 平文やキーをログに出力しないこと
 * - 暗号化キーは環境変数で管理（平文ファイル保存禁止）
 * - IVは暗号化ごとにランダム生成
 *
 * @module lib/infrastructure/crypto/web-crypto-encryption
 */

import { err, ok, type Result } from "@/lib/domain/shared/result";

import {
	CRYPTO_CONSTANTS,
	type CryptoError,
	decryptionFailed,
	encryptionFailed,
	encryptionKeyInvalid,
} from "./types";

// ============================================================
// ヘルパー関数（Base64 <-> Uint8Array変換）
// ============================================================

/**
 * Uint8ArrayをBase64文字列に変換
 *
 * btoaを使用してバイナリデータをBase64エンコードします。
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Base64文字列をUint8Arrayに変換
 *
 * atobを使用してBase64デコードし、Uint8Arrayに変換します。
 */
function base64ToUint8Array(base64: string): Uint8Array {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

// ============================================================
// 暗号化キーインポート
// ============================================================

/**
 * Base64エンコードされたキーをCryptoKeyにインポート
 *
 * 環境変数から取得したBase64文字列をWeb Crypto APIのCryptoKeyオブジェクトに変換します。
 * AES-256-GCMアルゴリズム用に設定され、暗号化・復号化の両方に使用できます。
 *
 * @param keyBase64 - Base64エンコードされた32バイトの暗号化キー
 * @returns 成功時はCryptoKey、失敗時はCryptoError
 */
export async function importEncryptionKey(
	keyBase64: string,
): Promise<Result<CryptoKey, CryptoError>> {
	try {
		// Base64デコード
		const keyBytes = base64ToUint8Array(keyBase64);

		// キー長検証（32バイト必須）
		if (keyBytes.length !== CRYPTO_CONSTANTS.KEY_LENGTH) {
			return err(
				encryptionKeyInvalid(
					`暗号化キーの長さが不正です: ${keyBytes.length}バイト（${CRYPTO_CONSTANTS.KEY_LENGTH}バイト必要）\n` +
						"キーは次のコマンドで生成できます: openssl rand -base64 32",
				),
			);
		}

		// CryptoKeyにインポート
		const cryptoKey = await crypto.subtle.importKey(
			"raw",
			keyBytes as unknown as BufferSource,
			{ name: "AES-GCM" },
			false,
			["encrypt", "decrypt"],
		);

		return ok(cryptoKey);
	} catch (e) {
		return err(
			encryptionKeyInvalid(
				"暗号化キーのインポートに失敗しました。正しいBase64形式で設定してください。\n" +
					"キーは次のコマンドで生成できます: openssl rand -base64 32",
				e,
			),
		);
	}
}

// ============================================================
// 暗号化
// ============================================================

/**
 * 文字列をAES-256-GCMで暗号化
 *
 * 指定された平文をWeb Crypto APIで暗号化し、
 * IV + 暗号文をBase64エンコードした文字列で返します。
 *
 * フォーマット: [IV: 12bytes][Ciphertext+AuthTag: variable] → Base64
 *
 * @param plaintext - 暗号化する平文
 * @param key - CryptoKeyオブジェクト
 * @returns 成功時はBase64エンコードされた暗号化文字列、失敗時はCryptoError
 */
export async function encrypt(
	plaintext: string,
	key: CryptoKey,
): Promise<Result<string, CryptoError>> {
	try {
		// ランダムなIVを生成（12バイト）
		const iv = crypto.getRandomValues(
			new Uint8Array(CRYPTO_CONSTANTS.IV_LENGTH),
		);

		// 平文をUint8Arrayに変換
		const encoder = new TextEncoder();
		const plaintextBytes = encoder.encode(plaintext);

		// AES-GCMで暗号化（認証タグは暗号文に自動的に付加される）
		const encryptedBuffer = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			key,
			plaintextBytes,
		);

		const encryptedBytes = new Uint8Array(encryptedBuffer);

		// IV + 暗号文（認証タグ含む）を結合
		const combined = new Uint8Array(iv.length + encryptedBytes.length);
		combined.set(iv, 0);
		combined.set(encryptedBytes, iv.length);

		// Base64エンコードして返す
		return ok(uint8ArrayToBase64(combined));
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
 * Base64エンコードされた暗号化文字列をデコードし、
 * IVと暗号文（認証タグ含む）を分離して復号化します。
 *
 * @param encrypted - Base64エンコードされた暗号化文字列（IV + Ciphertext+AuthTag）
 * @param key - CryptoKeyオブジェクト
 * @returns 成功時は平文、失敗時はCryptoError
 */
export async function decrypt(
	encrypted: string,
	key: CryptoKey,
): Promise<Result<string, CryptoError>> {
	try {
		// Base64デコード
		const combined = base64ToUint8Array(encrypted);

		// IVを抽出（先頭12バイト）
		const iv = combined.slice(0, CRYPTO_CONSTANTS.IV_LENGTH);

		// 暗号文（認証タグ含む）を抽出（残り）
		const ciphertext = combined.slice(CRYPTO_CONSTANTS.IV_LENGTH);

		// AES-GCMで復号化（認証タグの検証も自動的に行われる）
		const decryptedBuffer = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			ciphertext,
		);

		// Uint8Arrayを文字列に変換
		const decoder = new TextDecoder();
		return ok(decoder.decode(decryptedBuffer));
	} catch (e) {
		return err(
			decryptionFailed(
				"復号化処理に失敗しました。データが破損しているか、キーが一致しない可能性があります",
				e,
			),
		);
	}
}
