/**
 * D1イベントリポジトリ実装
 *
 * Cloudflare D1を使用したEventRepositoryの実装。
 * マルチテナント対応で、すべてのクエリにuser_idフィルタを適用します。
 *
 * @module lib/infrastructure/db/d1-event-repository
 *
 * @example
 * ```typescript
 * import { D1EventRepository } from '@/lib/infrastructure/db/d1-event-repository';
 * import { isOk } from '@/lib/domain/shared';
 *
 * const repository = new D1EventRepository(db, userId);
 *
 * // 時間範囲でイベントを取得
 * const result = await repository.findByRange({
 *   start: new Date('2026-01-26T00:00:00'),
 *   end: new Date('2026-01-26T23:59:59'),
 * });
 *
 * if (isOk(result)) {
 *   console.log(`${result.value.length}件のイベントを取得`);
 * }
 * ```
 */

import type { CalendarEvent } from "@/lib/domain/calendar/entities/event";
import { createCalendarEvent } from "@/lib/domain/calendar/entities/event";
import type { EventRepository } from "@/lib/domain/calendar/repository";
import {
	type DbError,
	dbQueryError,
	dbWriteError,
} from "@/lib/domain/shared/errors";
import { isSome, none, type Option, some } from "@/lib/domain/shared/option";
import { err, ok, type Result } from "@/lib/domain/shared/result";
import type { CalendarId, TimeRange } from "@/lib/domain/shared/types";
import { createCalendarId, createEventId } from "@/lib/domain/shared/types";

// ============================================================
// 内部型定義
// ============================================================

/**
 * calendar_eventsテーブルの行データ型（D1用）
 */
interface EventRow {
	readonly id: string;
	readonly calendar_id: string;
	readonly user_id: string;
	readonly title: string;
	readonly start_time: string;
	readonly end_time: string;
	readonly is_all_day: number;
	readonly location: string | null;
	readonly description: string | null;
	readonly source_type: "google" | "ical";
	readonly source_calendar_name: string;
	readonly source_account_email: string | null;
	readonly created_at: string;
	readonly updated_at: string;
}

/**
 * calendar_sync_stateテーブルの行データ型（D1用）
 */
interface SyncStateRow {
	readonly calendar_id: string;
	readonly user_id: string;
	readonly last_sync_time: string;
	readonly updated_at: string;
}

// ============================================================
// D1EventRepository実装
// ============================================================

/**
 * Cloudflare D1を使用したイベントリポジトリ実装
 *
 * D1の非同期APIを使用し、マルチテナント対応で
 * Result型でエラーハンドリングを行います。
 *
 * @implements {EventRepository}
 */
export class D1EventRepository implements EventRepository {
	/**
	 * D1EventRepositoryを生成
	 *
	 * @param db - Cloudflare D1データベース接続
	 * @param userId - 現在のユーザーID（マルチテナント分離用）
	 */
	constructor(
		private readonly db: D1Database,
		private readonly userId: string,
	) {}

	/**
	 * 時間範囲でイベントを検索
	 *
	 * 指定した期間に開始または終了するイベントを取得します。
	 * user_idでフィルタし、開始日時の昇順でソートされます。
	 *
	 * @param range - 検索する時間範囲
	 * @returns イベントの配列、またはDBエラー
	 */
	async findByRange(
		range: TimeRange,
	): Promise<Result<CalendarEvent[], DbError>> {
		const sql = `
			SELECT * FROM calendar_events
			WHERE user_id = ? AND start_time <= ? AND end_time >= ?
			ORDER BY start_time ASC
		`;

		try {
			const result = await this.db
				.prepare(sql)
				.bind(this.userId, range.end.toISOString(), range.start.toISOString())
				.all<EventRow>();

			return ok(result.results.map((row) => rowToEvent(row)));
		} catch (error) {
			return err(dbQueryError("イベント取得に失敗しました", sql, error));
		}
	}

	/**
	 * カレンダーIDでイベントを検索
	 *
	 * 特定のカレンダーに属するすべてのイベントを取得します。
	 * user_idでフィルタし、開始日時の昇順でソートされます。
	 *
	 * @param calendarId - 検索するカレンダーのID
	 * @returns イベントの配列、またはDBエラー
	 */
	async findByCalendarId(
		calendarId: CalendarId,
	): Promise<Result<CalendarEvent[], DbError>> {
		const sql = `
			SELECT * FROM calendar_events
			WHERE user_id = ? AND calendar_id = ?
			ORDER BY start_time ASC
		`;

		try {
			const result = await this.db
				.prepare(sql)
				.bind(this.userId, calendarId)
				.all<EventRow>();

			return ok(result.results.map((row) => rowToEvent(row)));
		} catch (error) {
			return err(
				dbQueryError(
					`カレンダー${calendarId}のイベント取得に失敗しました`,
					sql,
					error,
				),
			);
		}
	}

	/**
	 * イベントを一括保存（upsert）
	 *
	 * 複数のイベントを保存します。
	 * 同一ID+カレンダーID+user_idの組み合わせが存在する場合は更新します。
	 * D1のbatch APIを使用してトランザクション的に実行します。
	 *
	 * @param events - 保存するイベントの配列
	 * @returns 成功時はvoid、失敗時はDBエラー
	 */
	async saveMany(events: CalendarEvent[]): Promise<Result<void, DbError>> {
		if (events.length === 0) {
			return ok(undefined);
		}

		const sql = `
			INSERT OR REPLACE INTO calendar_events (
				id,
				calendar_id,
				user_id,
				title,
				start_time,
				end_time,
				is_all_day,
				location,
				description,
				source_type,
				source_calendar_name,
				source_account_email,
				updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
		`;

		try {
			const statements = events.map((event) =>
				this.db
					.prepare(sql)
					.bind(
						event.id,
						event.calendarId,
						this.userId,
						event.title,
						event.startTime.toISOString(),
						event.endTime.toISOString(),
						event.isAllDay ? 1 : 0,
						isSome(event.location) ? event.location.value : null,
						isSome(event.description) ? event.description.value : null,
						event.source.type,
						event.source.calendarName,
						event.source.accountEmail ?? null,
					),
			);

			await this.db.batch(statements);
			return ok(undefined);
		} catch (error) {
			return err(
				dbWriteError(
					`${events.length}件のイベント保存に失敗しました`,
					sql,
					error,
				),
			);
		}
	}

	/**
	 * カレンダーのイベントを全削除
	 *
	 * 指定したカレンダーに属するすべてのイベントを削除します。
	 * user_idでフィルタし、他ユーザーのデータには影響しません。
	 *
	 * @param calendarId - 削除対象のカレンダーID
	 * @returns 成功時はvoid、失敗時はDBエラー
	 */
	async deleteByCalendar(
		calendarId: CalendarId,
	): Promise<Result<void, DbError>> {
		const sql = `DELETE FROM calendar_events WHERE user_id = ? AND calendar_id = ?`;

		try {
			await this.db.prepare(sql).bind(this.userId, calendarId).run();
			return ok(undefined);
		} catch (error) {
			return err(
				dbWriteError(
					`カレンダー${calendarId}のイベント削除に失敗しました`,
					sql,
					error,
				),
			);
		}
	}

	/**
	 * 最終同期時刻を取得
	 *
	 * 指定したカレンダーの最終同期時刻を取得します。
	 * user_idでフィルタし、未同期の場合は None を返します。
	 *
	 * @param calendarId - カレンダーID
	 * @returns 最終同期時刻のOption、またはDBエラー
	 */
	async getLastSyncTime(
		calendarId: CalendarId,
	): Promise<Result<Option<Date>, DbError>> {
		const sql = `SELECT last_sync_time FROM calendar_sync_state WHERE user_id = ? AND calendar_id = ?`;

		try {
			const result = await this.db
				.prepare(sql)
				.bind(this.userId, calendarId)
				.first<Pick<SyncStateRow, "last_sync_time">>();

			if (!result) {
				return ok(none());
			}

			const date = new Date(result.last_sync_time);
			return ok(some(date));
		} catch (error) {
			return err(
				dbQueryError(
					`カレンダー${calendarId}の同期時刻取得に失敗しました`,
					sql,
					error,
				),
			);
		}
	}

	/**
	 * 最終同期時刻を更新
	 *
	 * 指定したカレンダーの最終同期時刻を更新します。
	 * 存在しない場合は新規作成、存在する場合は更新します。
	 * user_idでフィルタし、マルチテナント分離を維持します。
	 *
	 * @param calendarId - カレンダーID
	 * @param time - 同期時刻
	 * @returns 成功時はvoid、失敗時はDBエラー
	 */
	async updateLastSyncTime(
		calendarId: CalendarId,
		time: Date,
	): Promise<Result<void, DbError>> {
		const sql = `
			INSERT OR REPLACE INTO calendar_sync_state (calendar_id, user_id, last_sync_time, updated_at)
			VALUES (?, ?, ?, datetime('now'))
		`;

		try {
			await this.db
				.prepare(sql)
				.bind(calendarId, this.userId, time.toISOString())
				.run();
			return ok(undefined);
		} catch (error) {
			return err(
				dbWriteError(
					`カレンダー${calendarId}の同期時刻更新に失敗しました`,
					sql,
					error,
				),
			);
		}
	}

	/**
	 * カレンダーレコードの存在を保証
	 *
	 * calendar_events / calendar_sync_state テーブルの外部キー制約を
	 * 満たすために、calendars テーブルにレコードを確保します。
	 * 既存レコードがある場合は何もしません。
	 *
	 * @param calendarId - カレンダーID
	 * @param name - カレンダー名
	 * @param type - カレンダータイプ (google / ical)
	 * @param config - カレンダー設定JSON
	 * @param isActive - 有効かどうか
	 * @returns 成功時はvoid、失敗時はDBエラー
	 */
	async ensureCalendarRecord(
		calendarId: CalendarId,
		name: string,
		type: string,
		config: string,
		isActive: boolean,
	): Promise<Result<void, DbError>> {
		const sql = `
			INSERT OR IGNORE INTO calendars (id, user_id, name, type, config, is_active)
			VALUES (?, ?, ?, ?, ?, ?)
		`;

		try {
			await this.db
				.prepare(sql)
				.bind(
					String(calendarId),
					this.userId,
					name,
					type,
					config,
					isActive ? 1 : 0,
				)
				.run();
			return ok(undefined);
		} catch (error) {
			return err(
				dbWriteError(`カレンダー${calendarId}の登録に失敗しました`, sql, error),
			);
		}
	}
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * DBの行をCalendarEventに変換
 *
 * @param row - calendar_eventsテーブルの行データ
 * @returns CalendarEventエンティティ
 */
function rowToEvent(row: EventRow): CalendarEvent {
	return createCalendarEvent({
		id: createEventId(row.id),
		calendarId: createCalendarId(row.calendar_id),
		title: row.title,
		startTime: new Date(row.start_time),
		endTime: new Date(row.end_time),
		isAllDay: row.is_all_day === 1,
		location: row.location ?? undefined,
		description: row.description ?? undefined,
		source: {
			type: row.source_type,
			calendarName: row.source_calendar_name,
			accountEmail: row.source_account_email ?? undefined,
		},
	});
}
