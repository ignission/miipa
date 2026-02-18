/**
 * D1ベースのアプリケーション設定管理リポジトリ
 *
 * Cloudflare D1のuser_settingsテーブルを使用して、
 * ユーザーごとの設定をキー・バリュー形式で管理します。
 *
 * @module lib/infrastructure/config/d1-config-repository
 *
 * @example
 * ```typescript
 * import { D1ConfigRepository } from '@/lib/infrastructure/config/d1-config-repository';
 * import { isOk } from '@/lib/domain/shared';
 *
 * const repo = new D1ConfigRepository(db, userId);
 *
 * // 設定の保存
 * await repo.setSetting('theme', 'dark');
 *
 * // 設定の取得
 * const result = await repo.getSetting('theme');
 * if (isOk(result)) {
 *   console.log(result.value); // 'dark' | null
 * }
 * ```
 */

import type { ConfigError } from "@/lib/domain/shared/errors";
import {
	configParseError,
	configWriteFailed,
} from "@/lib/domain/shared/errors";
import { err, ok, type Result } from "@/lib/domain/shared/result";

// ============================================================
// 内部型定義
// ============================================================

/**
 * user_settingsテーブルの行データ型
 */
interface SettingRow {
	readonly user_id: string;
	readonly key: string;
	readonly value: string;
	readonly updated_at: string;
}

// ============================================================
// D1ConfigRepository実装
// ============================================================

/**
 * D1を使用した設定リポジトリ実装
 *
 * user_settingsテーブル（キー・バリュー形式）を使用して
 * ユーザーごとのアプリケーション設定を管理します。
 */
export class D1ConfigRepository {
	constructor(
		private readonly db: D1Database,
		private readonly userId: string,
	) {}

	/**
	 * ユーザーの全設定を取得
	 *
	 * @returns 設定のMap（key -> value）、またはConfigError
	 */
	async getSettings(): Promise<Result<Map<string, string>, ConfigError>> {
		const sql = "SELECT key, value FROM user_settings WHERE user_id = ?";

		try {
			const result = await this.db
				.prepare(sql)
				.bind(this.userId)
				.all<SettingRow>();

			const settings = new Map<string, string>();
			for (const row of result.results) {
				settings.set(row.key, row.value);
			}

			return ok(settings);
		} catch (error) {
			return err(
				configParseError(
					`ユーザー設定の取得に失敗しました: userId=${this.userId}`,
					error,
				),
			);
		}
	}

	/**
	 * 特定の設定を取得
	 *
	 * @param key - 設定キー
	 * @returns 設定値（存在しない場合はnull）、またはConfigError
	 */
	async getSetting(key: string): Promise<Result<string | null, ConfigError>> {
		const sql = "SELECT value FROM user_settings WHERE user_id = ? AND key = ?";

		try {
			const row = await this.db
				.prepare(sql)
				.bind(this.userId, key)
				.first<Pick<SettingRow, "value">>();

			return ok(row?.value ?? null);
		} catch (error) {
			return err(
				configParseError(
					`設定の取得に失敗しました: userId=${this.userId}, key=${key}`,
					error,
				),
			);
		}
	}

	/**
	 * 設定を保存（UPSERT）
	 *
	 * 既存のキーがある場合は上書き、ない場合は新規作成します。
	 *
	 * @param key - 設定キー
	 * @param value - 設定値
	 * @returns 成功時はvoid、失敗時はConfigError
	 */
	async setSetting(
		key: string,
		value: string,
	): Promise<Result<void, ConfigError>> {
		const sql = `
			INSERT OR REPLACE INTO user_settings (user_id, key, value, updated_at)
			VALUES (?, ?, ?, datetime('now'))
		`;

		try {
			await this.db.prepare(sql).bind(this.userId, key, value).run();
			return ok(undefined);
		} catch (error) {
			return err(
				configWriteFailed(
					`設定の保存に失敗しました: userId=${this.userId}, key=${key}`,
					error,
				),
			);
		}
	}

	/**
	 * 設定を削除
	 *
	 * @param key - 削除する設定キー
	 * @returns 成功時はvoid、失敗時はConfigError
	 */
	async deleteSetting(key: string): Promise<Result<void, ConfigError>> {
		const sql = "DELETE FROM user_settings WHERE user_id = ? AND key = ?";

		try {
			await this.db.prepare(sql).bind(this.userId, key).run();
			return ok(undefined);
		} catch (error) {
			return err(
				configWriteFailed(
					`設定の削除に失敗しました: userId=${this.userId}, key=${key}`,
					error,
				),
			);
		}
	}
}
