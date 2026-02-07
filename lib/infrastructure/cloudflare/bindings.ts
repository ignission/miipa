/**
 * Cloudflareバインディングヘルパーモジュール
 *
 * Cloudflare Workers環境（D1、環境変数）へのアクセスを抽象化するヘルパー関数を提供します。
 * OpenNextの `getCloudflareContext()` を使用してバインディングを取得し、
 * Result型で型安全なエラーハンドリングを実現します。
 *
 * @module lib/infrastructure/cloudflare/bindings
 * @example
 * ```typescript
 * import { getD1Database, getEncryptionKey } from '@/lib/infrastructure/cloudflare/bindings';
 * import { isOk } from '@/lib/domain/shared';
 *
 * const dbResult = getD1Database();
 * if (isOk(dbResult)) {
 *   const db = dbResult.value;
 *   // D1データベースを使用した処理
 * }
 *
 * const keyResult = getEncryptionKey();
 * if (isOk(keyResult)) {
 *   const key = keyResult.value;
 *   // 暗号化キーを使用した処理
 * }
 * ```
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type ConfigError, configNotFound } from "@/lib/domain/shared/errors";
import { err, ok, type Result } from "@/lib/domain/shared/result";
import type { DatabaseError } from "@/lib/infrastructure/db/types";

// ============================================================
// CloudflareEnvグローバル型拡張
// ============================================================

/**
 * wrangler.tomlで定義したカスタムバインディングの型宣言
 *
 * D1データベース（binding = "DB"）と暗号化キー（ENCRYPTION_KEY）を追加します。
 */
declare global {
	interface CloudflareEnv {
		/** D1データベースバインディング（wrangler.toml: binding = "DB"） */
		DB?: D1Database;
		/** 暗号化キー（Cloudflare Secrets / .dev.vars） */
		ENCRYPTION_KEY?: string;
	}
}

// ============================================================
// D1データベースバインディング取得
// ============================================================

/**
 * D1データベースバインディングのエラーコード
 */
const DB_BINDING_NAME = "DB";

/**
 * Cloudflare環境からD1データベースバインディングを取得
 *
 * wrangler.tomlで定義されたD1バインディング（binding = "DB"）を取得します。
 * バインディングが見つからない場合や、Cloudflare環境外で実行された場合は
 * エラーを返します。
 *
 * @returns 成功時はD1Database、失敗時はDatabaseError
 *
 * @example
 * ```typescript
 * const result = getD1Database();
 * if (isOk(result)) {
 *   const db = result.value;
 *   const stmt = db.prepare('SELECT * FROM users');
 *   const rows = await stmt.all();
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function getD1Database(): Result<D1Database, DatabaseError> {
	try {
		const { env } = getCloudflareContext();
		const db = env[DB_BINDING_NAME];

		if (!db) {
			return err({
				code: "DATABASE_NOT_INITIALIZED",
				message: `D1データベースバインディング "${DB_BINDING_NAME}" が見つかりません。wrangler.tomlのd1_databases設定を確認してください`,
			});
		}

		return ok(db);
	} catch (e) {
		return err({
			code: "DATABASE_OPEN_ERROR",
			message:
				"Cloudflareコンテキストの取得に失敗しました。Cloudflare Workers環境で実行されているか確認してください",
			cause: e,
		});
	}
}

// ============================================================
// 暗号化キー取得
// ============================================================

/**
 * 暗号化キーの環境変数名
 */
const ENCRYPTION_KEY_ENV_NAME = "ENCRYPTION_KEY";

/**
 * Cloudflare環境変数から暗号化キーを取得
 *
 * Cloudflare Workers Secrets（.dev.vars / wrangler secret put）で設定された
 * ENCRYPTION_KEYを取得します。
 *
 * @returns 成功時は暗号化キー文字列、失敗時はConfigError
 *
 * @example
 * ```typescript
 * const result = getEncryptionKey();
 * if (isOk(result)) {
 *   const key = result.value;
 *   // 暗号化キーを使用した処理
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function getEncryptionKey(): Result<string, ConfigError> {
	try {
		const { env } = getCloudflareContext();
		const key = env[ENCRYPTION_KEY_ENV_NAME];

		if (!key) {
			return err(
				configNotFound(
					`環境変数 "${ENCRYPTION_KEY_ENV_NAME}" が設定されていません。Cloudflare Secretsまたは.dev.varsで設定してください`,
				),
			);
		}

		return ok(key);
	} catch (e) {
		return err(
			configNotFound(
				"Cloudflareコンテキストの取得に失敗しました。Cloudflare Workers環境で実行されているか確認してください",
				e,
			),
		);
	}
}
