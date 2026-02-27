import { describe, expect, it } from "vitest";
import { isErr, isOk } from "@/lib/domain/shared/result";
import {
	decrypt,
	encrypt,
	importEncryptionKey,
} from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * 32バイトのランダムキーをBase64文字列として生成
 */
function generateTestKeyBase64(): string {
	const keyBytes = crypto.getRandomValues(new Uint8Array(32));
	let binary = "";
	for (let i = 0; i < keyBytes.length; i++) {
		binary += String.fromCharCode(keyBytes[i]);
	}
	return btoa(binary);
}

describe("importEncryptionKey", () => {
	it("正しい32バイトBase64キーからCryptoKeyをインポートできる", async () => {
		const keyBase64 = generateTestKeyBase64();
		const result = await importEncryptionKey(keyBase64);

		expect(isOk(result)).toBe(true);
		if (isOk(result)) {
			expect(result.value).toBeInstanceOf(CryptoKey);
		}
	});

	it("キー長が不正な場合ENCRYPTION_KEY_INVALIDを返す", async () => {
		// 16バイトのキー（32バイト必要）
		const shortKey = crypto.getRandomValues(new Uint8Array(16));
		let binary = "";
		for (let i = 0; i < shortKey.length; i++) {
			binary += String.fromCharCode(shortKey[i]);
		}
		const keyBase64 = btoa(binary);

		const result = await importEncryptionKey(keyBase64);

		expect(isErr(result)).toBe(true);
		if (isErr(result)) {
			expect(result.error.code).toBe("ENCRYPTION_KEY_INVALID");
		}
	});

	it("不正なBase64文字列でエラーを返す", async () => {
		const result = await importEncryptionKey("!!!invalid-base64!!!");

		expect(isErr(result)).toBe(true);
		if (isErr(result)) {
			expect(result.error.code).toBe("ENCRYPTION_KEY_INVALID");
		}
	});
});

describe("encrypt / decrypt", () => {
	it("暗号化→復号化のラウンドトリップが成功する", async () => {
		const keyBase64 = generateTestKeyBase64();
		const keyResult = await importEncryptionKey(keyBase64);
		if (!isOk(keyResult)) throw new Error("キーのインポートに失敗");
		const key = keyResult.value;

		const plaintext = "Hello, World!";
		const encryptResult = await encrypt(plaintext, key);
		expect(isOk(encryptResult)).toBe(true);
		if (!isOk(encryptResult)) return;

		const decryptResult = await decrypt(encryptResult.value, key);
		expect(isOk(decryptResult)).toBe(true);
		if (isOk(decryptResult)) {
			expect(decryptResult.value).toBe(plaintext);
		}
	});

	it("異なるキーで復号化するとエラーを返す", async () => {
		const keyA = generateTestKeyBase64();
		const keyB = generateTestKeyBase64();
		const keyResultA = await importEncryptionKey(keyA);
		const keyResultB = await importEncryptionKey(keyB);
		if (!isOk(keyResultA) || !isOk(keyResultB))
			throw new Error("キーのインポートに失敗");

		const encryptResult = await encrypt("secret data", keyResultA.value);
		if (!isOk(encryptResult)) throw new Error("暗号化に失敗");

		const decryptResult = await decrypt(encryptResult.value, keyResultB.value);
		expect(isErr(decryptResult)).toBe(true);
		if (isErr(decryptResult)) {
			expect(decryptResult.error.code).toBe("DECRYPTION_FAILED");
		}
	});

	it("不正な暗号化データの復号化でエラーを返す", async () => {
		const keyBase64 = generateTestKeyBase64();
		const keyResult = await importEncryptionKey(keyBase64);
		if (!isOk(keyResult)) throw new Error("キーのインポートに失敗");

		const decryptResult = await decrypt("garbage-data", keyResult.value);
		expect(isErr(decryptResult)).toBe(true);
		if (isErr(decryptResult)) {
			expect(decryptResult.error.code).toBe("DECRYPTION_FAILED");
		}
	});

	it("空文字列の暗号化・復号化が成功する", async () => {
		const keyBase64 = generateTestKeyBase64();
		const keyResult = await importEncryptionKey(keyBase64);
		if (!isOk(keyResult)) throw new Error("キーのインポートに失敗");
		const key = keyResult.value;

		const encryptResult = await encrypt("", key);
		expect(isOk(encryptResult)).toBe(true);
		if (!isOk(encryptResult)) return;

		const decryptResult = await decrypt(encryptResult.value, key);
		expect(isOk(decryptResult)).toBe(true);
		if (isOk(decryptResult)) {
			expect(decryptResult.value).toBe("");
		}
	});

	it("日本語テキストの暗号化・復号化が成功する", async () => {
		const keyBase64 = generateTestKeyBase64();
		const keyResult = await importEncryptionKey(keyBase64);
		if (!isOk(keyResult)) throw new Error("キーのインポートに失敗");
		const key = keyResult.value;

		const plaintext = "こんにちは世界！日本語テスト🎉";
		const encryptResult = await encrypt(plaintext, key);
		expect(isOk(encryptResult)).toBe(true);
		if (!isOk(encryptResult)) return;

		const decryptResult = await decrypt(encryptResult.value, key);
		expect(isOk(decryptResult)).toBe(true);
		if (isOk(decryptResult)) {
			expect(decryptResult.value).toBe(plaintext);
		}
	});

	it("同じ平文を2回暗号化すると異なる暗号文を生成する（IVのランダム性）", async () => {
		const keyBase64 = generateTestKeyBase64();
		const keyResult = await importEncryptionKey(keyBase64);
		if (!isOk(keyResult)) throw new Error("キーのインポートに失敗");
		const key = keyResult.value;

		const plaintext = "deterministic test";
		const enc1 = await encrypt(plaintext, key);
		const enc2 = await encrypt(plaintext, key);
		expect(isOk(enc1)).toBe(true);
		expect(isOk(enc2)).toBe(true);
		if (isOk(enc1) && isOk(enc2)) {
			expect(enc1.value).not.toBe(enc2.value);
		}
	});
});
