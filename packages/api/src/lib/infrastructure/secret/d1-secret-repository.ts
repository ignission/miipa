/**
 * D1暗号化シークレットリポジトリモジュール
 *
 * Cloudflare D1データベースを使用したマルチテナント対応の暗号化シークレットストレージ。
 * Web Crypto API（AES-256-GCM）で暗号化し、ユーザーごとにシークレットを分離管理します。
 *
 * セキュリティ上の注意:
 * - 暗号化キーはCryptoKeyオブジェクトとして外部から注入
 * - 平文はメモリ上でのみ扱い、ログ出力禁止
 * - DBには暗号化されたBase64文字列のみ保存
 * - user_idによるマルチテナント分離
 *
 * @module lib/infrastructure/secret/d1-secret-repository
 */

import { err, ok, type Result } from "@/lib/domain/shared/result";
import {
	decrypt,
	encrypt,
} from "@/lib/infrastructure/crypto/web-crypto-encryption";
import {
	type SecretError,
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
	/** ユーザーID */
	user_id: string;
	/** シークレットキー */
	key: string;
	/** 暗号化された値（Base64） */
	encrypted_value: string;
}

// ============================================================
// SQLステートメント
// ============================================================

const SQL = {
	/** シークレットを取得 */
	SELECT:
		"SELECT encrypted_value FROM credentials WHERE user_id = ? AND key = ?",
	/** シークレットを保存（存在する場合は更新） */
	UPSERT: `INSERT OR REPLACE INTO credentials (user_id, key, encrypted_value, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
	/** シークレットを削除 */
	DELETE: "DELETE FROM credentials WHERE user_id = ? AND key = ?",
	/** シークレットの存在確認 */
	EXISTS: "SELECT 1 FROM credentials WHERE user_id = ? AND key = ?",
} as const;

// ============================================================
// D1SecretRepository
// ============================================================

/**
 * D1ベースのマルチテナント対応シークレットリポジトリ
 *
 * Cloudflare D1データベースに暗号化されたシークレットを保存・取得します。
 * ユーザーIDと暗号化キーをコンストラクタで受け取り、テナント分離を実現します。
 *
 * @example
 * ```typescript
 * const repo = new D1SecretRepository(env.DB, userId, encryptionKey);
 *
 * // シークレットの保存
 * const saveResult = await repo.setSecret('anthropic-api-key', 'sk-xxx');
 *
 * // シークレットの取得
 * const getResult = await repo.getSecret('anthropic-api-key');
 * ```
 */
export class D1SecretRepository {
	constructor(
		private readonly db: D1Database,
		private readonly userId: string,
		private readonly encryptionKey: CryptoKey,
	) {}

	/**
	 * シークレットを取得（復号化して返す）
	 *
	 * 指定されたキーに対応するシークレット値をD1から取得し復号化します。
	 * シークレットが存在しない場合は `Ok(null)` を返します。
	 *
	 * @param key - 取得するシークレットのキー
	 * @returns 復号化されたシークレット値またはnull
	 */
	async getSecret(key: string): Promise<Result<string | null, SecretError>> {
		try {
			// D1からSELECT
			const row = await this.db
				.prepare(SQL.SELECT)
				.bind(this.userId, key)
				.first<Pick<CredentialRow, "encrypted_value">>();

			// なければOk(null)を返す
			if (!row) {
				return ok(null);
			}

			// 復号化
			const decryptResult = await decrypt(
				row.encrypted_value,
				this.encryptionKey,
			);
			if (decryptResult._tag === "Err") {
				return err(
					secretReadFailed(
						key,
						`シークレットの復号化に失敗しました: ${decryptResult.error.message}`,
						decryptResult.error,
					),
				);
			}

			return ok(decryptResult.value);
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
	 * シークレットを保存（暗号化して保存）
	 *
	 * 指定されたキーと値でD1にシークレットを暗号化して保存します。
	 * 同じキーのシークレットが既に存在する場合は上書きします。
	 *
	 * @param key - 保存するシークレットのキー
	 * @param value - 保存するシークレット値
	 * @returns 成功時はOk(void)、失敗時はErr(SecretError)
	 */
	async setSecret(
		key: string,
		value: string,
	): Promise<Result<void, SecretError>> {
		try {
			// 暗号化
			const encryptResult = await encrypt(value, this.encryptionKey);
			if (encryptResult._tag === "Err") {
				return err(
					secretWriteFailed(
						key,
						`シークレットの暗号化に失敗しました: ${encryptResult.error.message}`,
						encryptResult.error,
					),
				);
			}

			// D1にINSERT OR REPLACE
			await this.db
				.prepare(SQL.UPSERT)
				.bind(this.userId, key, encryptResult.value)
				.run();

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
	 * シークレットを削除
	 *
	 * 指定されたキーに対応するシークレットをD1から削除します。
	 * シークレットが存在しない場合も成功として扱います。
	 *
	 * @param key - 削除するシークレットのキー
	 * @returns 成功時はOk(void)、失敗時はErr(SecretError)
	 */
	async deleteSecret(key: string): Promise<Result<void, SecretError>> {
		try {
			await this.db.prepare(SQL.DELETE).bind(this.userId, key).run();

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
	 * シークレットの存在確認
	 *
	 * 指定されたキーのシークレットが存在するかどうかを確認します。
	 *
	 * @param key - 確認するシークレットのキー
	 * @returns 存在する場合はOk(true)、存在しない場合はOk(false)
	 */
	async hasSecret(key: string): Promise<Result<boolean, SecretError>> {
		try {
			const row = await this.db
				.prepare(SQL.EXISTS)
				.bind(this.userId, key)
				.first();

			return ok(row !== null);
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
}
