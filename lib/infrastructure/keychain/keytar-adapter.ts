/**
 * Keytar アダプターモジュール
 *
 * macOS Keychainを操作するための関数を提供します。
 * keytarライブラリをラップし、Result型とOption型を使用した
 * 型安全なインターフェースを提供します。
 *
 * @module lib/infrastructure/keychain/keytar-adapter
 * @example
 * ```typescript
 * import { getSecret, setSecret, deleteSecret } from '@/lib/infrastructure/keychain/keytar-adapter';
 *
 * // シークレットの保存
 * const saveResult = await setSecret('anthropic-api-key', 'sk-xxx');
 * if (isOk(saveResult)) {
 *   console.log('保存成功');
 * }
 *
 * // シークレットの取得
 * const getResult = await getSecret('anthropic-api-key');
 * if (isOk(getResult) && isSome(getResult.value)) {
 *   console.log('APIキー:', getResult.value.value);
 * }
 * ```
 */

import keytar from "keytar";
import {
	err,
	type KeychainError,
	keychainAccessDenied,
	keychainWriteFailed,
	none,
	type Option,
	ok,
	type Result,
	some,
} from "@/lib/domain/shared";
import { KEYCHAIN_SERVICE, type SecretKey } from "./types";

// ============================================================
// エラーハンドリングユーティリティ
// ============================================================

/**
 * keytarエラーをKeychainErrorに変換
 *
 * @param error - 発生したエラー
 * @param operation - 操作名（日本語）
 * @returns KeychainError
 */
function mapKeytarError(error: unknown, operation: string): KeychainError {
	// エラーメッセージを取得
	const errorMessage = error instanceof Error ? error.message : String(error);

	// アクセス拒否エラーの判定
	// keytarはmacOSのセキュリティダイアログでユーザーが拒否した場合などにエラーをスロー
	if (
		errorMessage.includes("denied") ||
		errorMessage.includes("permission") ||
		errorMessage.includes("access")
	) {
		return keychainAccessDenied(
			KEYCHAIN_SERVICE,
			`Keychainへの${operation}が拒否されました。システム環境設定でアクセスを許可してください`,
			error,
		);
	}

	// その他のエラーは書き込み/操作エラーとして扱う
	return keychainWriteFailed(
		KEYCHAIN_SERVICE,
		`Keychainの${operation}に失敗しました: ${errorMessage}`,
		error,
	);
}

// ============================================================
// シークレット操作関数
// ============================================================

/**
 * Keychainからシークレットを取得
 *
 * 指定されたキーに対応するシークレット値をKeychainから取得します。
 * シークレットが存在しない場合は `Ok(None)` を返します。
 * エラーが発生した場合は `Err(KeychainError)` を返します。
 *
 * @param key - 取得するシークレットのキー
 * @returns シークレット値を含むResult<Option<string>, KeychainError>
 *
 * @example
 * ```typescript
 * const result = await getSecret('anthropic-api-key');
 *
 * match(result, {
 *   ok: (option) => optionMatch(option, {
 *     some: (value) => console.log('APIキー取得成功:', value),
 *     none: () => console.log('APIキーが設定されていません'),
 *   }),
 *   err: (error) => console.error('エラー:', error.message),
 * });
 * ```
 */
export async function getSecret(
	key: SecretKey,
): Promise<Result<Option<string>, KeychainError>> {
	try {
		const secret = await keytar.getPassword(KEYCHAIN_SERVICE, key);

		if (secret === null) {
			return ok(none());
		}

		return ok(some(secret));
	} catch (error) {
		return err(mapKeytarError(error, "読み取り"));
	}
}

/**
 * Keychainにシークレットを保存
 *
 * 指定されたキーと値でKeychainにシークレットを保存します。
 * 同じキーのシークレットが既に存在する場合は上書きします。
 *
 * @param key - 保存するシークレットのキー
 * @param value - 保存するシークレット値
 * @returns 成功時はOk(void)、失敗時はErr(KeychainError)
 *
 * @example
 * ```typescript
 * const result = await setSecret('anthropic-api-key', 'sk-xxx');
 *
 * match(result, {
 *   ok: () => console.log('APIキーを保存しました'),
 *   err: (error) => console.error('保存に失敗:', error.message),
 * });
 * ```
 */
export async function setSecret(
	key: SecretKey,
	value: string,
): Promise<Result<void, KeychainError>> {
	try {
		await keytar.setPassword(KEYCHAIN_SERVICE, key, value);
		return ok(undefined);
	} catch (error) {
		return err(mapKeytarError(error, "書き込み"));
	}
}

/**
 * Keychainからシークレットを削除
 *
 * 指定されたキーに対応するシークレットをKeychainから削除します。
 * シークレットが存在しない場合も成功として扱います。
 *
 * @param key - 削除するシークレットのキー
 * @returns 成功時はOk(void)、失敗時はErr(KeychainError)
 *
 * @example
 * ```typescript
 * const result = await deleteSecret('anthropic-api-key');
 *
 * match(result, {
 *   ok: () => console.log('APIキーを削除しました'),
 *   err: (error) => console.error('削除に失敗:', error.message),
 * });
 * ```
 */
export async function deleteSecret(
	key: SecretKey,
): Promise<Result<void, KeychainError>> {
	try {
		// deletePasswordは削除成功時にtrue、存在しない場合はfalseを返す
		// どちらの場合も成功として扱う
		await keytar.deletePassword(KEYCHAIN_SERVICE, key);
		return ok(undefined);
	} catch (error) {
		return err(mapKeytarError(error, "削除"));
	}
}

/**
 * 指定されたキーのシークレットが存在するかどうかを確認
 *
 * @param key - 確認するシークレットのキー
 * @returns 存在確認の結果を含むResult<boolean, KeychainError>
 *
 * @example
 * ```typescript
 * const result = await hasSecret('anthropic-api-key');
 *
 * if (isOk(result) && result.value) {
 *   console.log('APIキーは設定済みです');
 * }
 * ```
 */
export async function hasSecret(
	key: SecretKey,
): Promise<Result<boolean, KeychainError>> {
	try {
		const secret = await keytar.getPassword(KEYCHAIN_SERVICE, key);
		return ok(secret !== null);
	} catch (error) {
		return err(mapKeytarError(error, "確認"));
	}
}

/**
 * 複数のシークレットを一括で取得
 *
 * 指定された複数のキーに対応するシークレットを一括で取得します。
 * いずれかのキーでエラーが発生した場合、そのエラーを返します。
 *
 * @param keys - 取得するシークレットのキー配列
 * @returns キーと値のマップを含むResult
 *
 * @example
 * ```typescript
 * const result = await getSecrets(['anthropic-api-key', 'openai-api-key']);
 *
 * if (isOk(result)) {
 *   const anthropicKey = result.value.get('anthropic-api-key');
 *   // ...
 * }
 * ```
 */
export async function getSecrets(
	keys: readonly SecretKey[],
): Promise<Result<Map<SecretKey, Option<string>>, KeychainError>> {
	const results = new Map<SecretKey, Option<string>>();

	for (const key of keys) {
		const result = await getSecret(key);

		if (result._tag === "Err") {
			return result;
		}

		results.set(key, result.value);
	}

	return ok(results);
}
