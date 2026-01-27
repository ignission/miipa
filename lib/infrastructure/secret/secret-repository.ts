/**
 * SQLite暗号化シークレットリポジトリモジュール
 *
 * SQLiteデータベースを使用した暗号化シークレットストレージを提供します。
 * keytar-adapter.tsと同一インターフェースで、AES-256-GCM暗号化によりシークレットを安全に保存します。
 *
 * セキュリティ上の注意:
 * - 暗号化キーは環境変数SOLODAY_ENCRYPTION_KEYで管理
 * - 平文はメモリ上でのみ扱い、ログ出力禁止
 * - DBには暗号化されたBase64文字列のみ保存
 *
 * @module lib/infrastructure/secret/secret-repository
 * @example
 * ```typescript
 * import { getSecret, setSecret, deleteSecret } from '@/lib/infrastructure/secret/secret-repository';
 * import { isOk, isSome, match } from '@/lib/domain/shared';
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
 *   console.log('APIキー取得成功');
 * }
 * ```
 */

import {
	err,
	none,
	type Option,
	ok,
	type Result,
	some,
} from "@/lib/domain/shared";
import {
	decrypt,
	deserialize,
	encrypt,
	getEncryptionKey,
	serialize,
} from "@/lib/infrastructure/crypto";
import { getDatabase } from "@/lib/infrastructure/db";
import {
	type SecretError,
	type SecretKey,
	secretDeleteFailed,
	secretReadFailed,
	secretWriteFailed,
} from "./types";

// ============================================================
// 型定義
// ============================================================

/**
 * credentialsテーブルの行データ
 */
interface CredentialRow {
	/** シークレットキー */
	key: string;
	/** 暗号化された値（Base64） */
	encrypted_value: string;
	/** 作成日時 */
	created_at: string;
	/** 更新日時 */
	updated_at: string;
}

// ============================================================
// SQLステートメント
// ============================================================

const SQL = {
	/** シークレットを取得 */
	SELECT: "SELECT key, encrypted_value FROM credentials WHERE key = ?",
	/** シークレットを保存（存在する場合は更新） */
	UPSERT: `
		INSERT INTO credentials (key, encrypted_value, created_at, updated_at)
		VALUES (?, ?, datetime('now'), datetime('now'))
		ON CONFLICT(key) DO UPDATE SET
			encrypted_value = excluded.encrypted_value,
			updated_at = datetime('now')
	`,
	/** シークレットを削除 */
	DELETE: "DELETE FROM credentials WHERE key = ?",
	/** シークレットの存在確認 */
	EXISTS: "SELECT 1 FROM credentials WHERE key = ?",
} as const;

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * データベース接続を取得
 *
 * @returns データベース接続またはエラー
 */
function getDatabaseConnection(): Result<
	ReturnType<typeof getDatabase> extends Option<infer T> ? T : never,
	SecretError
> {
	const dbOption = getDatabase();

	if (dbOption._tag === "None") {
		return err(
			secretReadFailed(
				"",
				"データベースが初期化されていません。initializeDatabase()を先に呼び出してください。",
			),
		);
	}

	return ok(dbOption.value);
}

// ============================================================
// シークレット操作関数
// ============================================================

/**
 * SQLiteからシークレットを取得
 *
 * 指定されたキーに対応するシークレット値をSQLiteから取得し復号化します。
 * シークレットが存在しない場合は `Ok(None)` を返します。
 * エラーが発生した場合は `Err(SecretError)` を返します。
 *
 * @param key - 取得するシークレットのキー
 * @returns シークレット値を含むResult<Option<string>, SecretError>
 *
 * @example
 * ```typescript
 * const result = await getSecret('anthropic-api-key');
 *
 * match(result, {
 *   ok: (option) => optionMatch(option, {
 *     some: (value) => console.log('APIキー取得成功'),
 *     none: () => console.log('APIキーが設定されていません'),
 *   }),
 *   err: (error) => console.error('エラー:', error.message),
 * });
 * ```
 */
export async function getSecret(
	key: SecretKey,
): Promise<Result<Option<string>, SecretError>> {
	// 1. データベース接続を取得
	const dbResult = getDatabaseConnection();
	if (dbResult._tag === "Err") {
		return dbResult;
	}
	const db = dbResult.value;

	try {
		// 2. DBからSELECT
		const stmt = db.prepare(SQL.SELECT);
		const row = stmt.get(key) as CredentialRow | undefined;

		// 3. なければOk(None)を返す
		if (!row) {
			return ok(none());
		}

		// 4. あればdeserialize()
		const encryptedData = deserialize(row.encrypted_value);

		// 5. getEncryptionKey()でキー取得
		const keyResult = getEncryptionKey();
		if (keyResult._tag === "Err") {
			return err({
				code: keyResult.error.code,
				message: keyResult.error.message,
				key,
				cause: keyResult.error.cause,
			});
		}

		// 6. decrypt()で復号化
		const decryptResult = decrypt(encryptedData, keyResult.value);
		if (decryptResult._tag === "Err") {
			return err({
				code: decryptResult.error.code,
				message: decryptResult.error.message,
				key,
				cause: decryptResult.error.cause,
			});
		}

		// 7. Ok(Some(plaintext))を返す
		return ok(some(decryptResult.value));
	} catch (error) {
		return err(
			secretReadFailed(
				key,
				`シークレットの読み込み中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
				error,
			),
		);
	}
}

/**
 * SQLiteにシークレットを保存
 *
 * 指定されたキーと値でSQLiteにシークレットを暗号化して保存します。
 * 同じキーのシークレットが既に存在する場合は上書きします。
 *
 * @param key - 保存するシークレットのキー
 * @param value - 保存するシークレット値
 * @returns 成功時はOk(void)、失敗時はErr(SecretError)
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
): Promise<Result<void, SecretError>> {
	// 1. データベース接続を取得
	const dbResult = getDatabaseConnection();
	if (dbResult._tag === "Err") {
		return dbResult;
	}
	const db = dbResult.value;

	try {
		// 2. getEncryptionKey()でキー取得
		const keyResult = getEncryptionKey();
		if (keyResult._tag === "Err") {
			return err({
				code: keyResult.error.code,
				message: keyResult.error.message,
				key,
				cause: keyResult.error.cause,
			});
		}

		// 3. encrypt(value, key)で暗号化
		const encryptResult = encrypt(value, keyResult.value);
		if (encryptResult._tag === "Err") {
			return err({
				code: encryptResult.error.code,
				message: encryptResult.error.message,
				key,
				cause: encryptResult.error.cause,
			});
		}

		// 4. serialize()でBase64化
		const serialized = serialize(encryptResult.value);

		// 5. DBにINSERT OR REPLACE
		const stmt = db.prepare(SQL.UPSERT);
		stmt.run(key, serialized);

		return ok(undefined);
	} catch (error) {
		return err(
			secretWriteFailed(
				key,
				`シークレットの保存中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
				error,
			),
		);
	}
}

/**
 * SQLiteからシークレットを削除
 *
 * 指定されたキーに対応するシークレットをSQLiteから削除します。
 * シークレットが存在しない場合も成功として扱います。
 *
 * @param key - 削除するシークレットのキー
 * @returns 成功時はOk(void)、失敗時はErr(SecretError)
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
): Promise<Result<void, SecretError>> {
	// 1. データベース接続を取得
	const dbResult = getDatabaseConnection();
	if (dbResult._tag === "Err") {
		return dbResult;
	}
	const db = dbResult.value;

	try {
		// 2. DBからDELETE
		const stmt = db.prepare(SQL.DELETE);
		stmt.run(key);

		return ok(undefined);
	} catch (error) {
		return err(
			secretDeleteFailed(
				key,
				`シークレットの削除中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
				error,
			),
		);
	}
}

/**
 * 指定されたキーのシークレットが存在するかどうかを確認
 *
 * @param key - 確認するシークレットのキー
 * @returns 存在確認の結果を含むResult<boolean, SecretError>
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
): Promise<Result<boolean, SecretError>> {
	// 1. データベース接続を取得
	const dbResult = getDatabaseConnection();
	if (dbResult._tag === "Err") {
		return dbResult;
	}
	const db = dbResult.value;

	try {
		// 2. DBにSELECTして存在確認
		const stmt = db.prepare(SQL.EXISTS);
		const row = stmt.get(key);

		return ok(row !== undefined);
	} catch (error) {
		return err(
			secretReadFailed(
				key,
				`シークレットの存在確認中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
				error,
			),
		);
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
): Promise<Result<Map<SecretKey, Option<string>>, SecretError>> {
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
