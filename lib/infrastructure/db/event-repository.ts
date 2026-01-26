/**
 * イベントリポジトリ実装
 *
 * SQLiteを使用したEventRepositoryの実装。
 * カレンダーイベントのキャッシュ読み書きと同期状態管理を提供します。
 *
 * @module lib/infrastructure/db/event-repository
 *
 * @example
 * ```typescript
 * import { SqliteEventRepository } from '@/lib/infrastructure/db/event-repository';
 * import { getDatabase } from '@/lib/infrastructure/db';
 * import { isSome, isOk } from '@/lib/domain/shared';
 *
 * const dbOption = getDatabase();
 * if (isSome(dbOption)) {
 *   const repository = new SqliteEventRepository(dbOption.value);
 *
 *   // 時間範囲でイベントを取得
 *   const result = await repository.findByRange({
 *     start: new Date('2026-01-26T00:00:00'),
 *     end: new Date('2026-01-26T23:59:59'),
 *   });
 *
 *   if (isOk(result)) {
 *     console.log(`${result.value.length}件のイベントを取得`);
 *   }
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
import type { DatabaseConnection } from "./types";

// ============================================================
// 内部型定義
// ============================================================

/**
 * calendar_eventsテーブルの行データ型
 */
interface EventRow {
	readonly id: string;
	readonly calendar_id: string;
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
 * calendar_sync_stateテーブルの行データ型
 */
interface SyncStateRow {
	readonly calendar_id: string;
	readonly last_sync_time: string;
	readonly updated_at: string;
}

// ============================================================
// SqliteEventRepository実装
// ============================================================

/**
 * SQLiteを使用したイベントリポジトリ実装
 *
 * better-sqlite3の同期APIをasyncでラップし、
 * Result型でエラーハンドリングを行います。
 *
 * @implements {EventRepository}
 */
export class SqliteEventRepository implements EventRepository {
	/**
	 * SqliteEventRepositoryを生成
	 *
	 * @param db - better-sqlite3のデータベース接続
	 */
	constructor(private readonly db: DatabaseConnection) {}

	/**
	 * 時間範囲でイベントを検索
	 *
	 * 指定した期間に開始または終了するイベントを取得します。
	 * 開始日時の昇順でソートされます。
	 *
	 * @param range - 検索する時間範囲
	 * @returns イベントの配列、またはDBエラー
	 */
	async findByRange(
		range: TimeRange,
	): Promise<Result<CalendarEvent[], DbError>> {
		const sql = `
			SELECT * FROM calendar_events
			WHERE start_time <= ? AND end_time >= ?
			ORDER BY start_time ASC
		`;

		try {
			const rows = this.db
				.prepare(sql)
				.all(range.end.toISOString(), range.start.toISOString()) as EventRow[];

			return ok(rows.map((row) => this.rowToEvent(row)));
		} catch (error) {
			return err(dbQueryError("イベント取得に失敗しました", sql, error));
		}
	}

	/**
	 * カレンダーIDでイベントを検索
	 *
	 * 特定のカレンダーに属するすべてのイベントを取得します。
	 * 開始日時の昇順でソートされます。
	 *
	 * @param calendarId - 検索するカレンダーのID
	 * @returns イベントの配列、またはDBエラー
	 */
	async findByCalendarId(
		calendarId: CalendarId,
	): Promise<Result<CalendarEvent[], DbError>> {
		const sql = `
			SELECT * FROM calendar_events
			WHERE calendar_id = ?
			ORDER BY start_time ASC
		`;

		try {
			const rows = this.db.prepare(sql).all(calendarId) as EventRow[];

			return ok(rows.map((row) => this.rowToEvent(row)));
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
	 * 同一ID+カレンダーIDの組み合わせが存在する場合は更新します。
	 * トランザクション内で実行され、一部失敗時は全体がロールバックされます。
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
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
		`;

		try {
			const stmt = this.db.prepare(sql);
			const insertMany = this.db.transaction(
				(eventsToInsert: CalendarEvent[]) => {
					for (const event of eventsToInsert) {
						stmt.run(
							event.id,
							event.calendarId,
							event.title,
							event.startTime.toISOString(),
							event.endTime.toISOString(),
							event.isAllDay ? 1 : 0,
							isSome(event.location) ? event.location.value : null,
							isSome(event.description) ? event.description.value : null,
							event.source.type,
							event.source.calendarName,
							event.source.accountEmail ?? null,
						);
					}
				},
			);

			insertMany(events);
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
	 * カレンダー自体を削除する際のクリーンアップに使用します。
	 *
	 * @param calendarId - 削除対象のカレンダーID
	 * @returns 成功時はvoid、失敗時はDBエラー
	 */
	async deleteByCalendar(
		calendarId: CalendarId,
	): Promise<Result<void, DbError>> {
		const sql = `DELETE FROM calendar_events WHERE calendar_id = ?`;

		try {
			this.db.prepare(sql).run(calendarId);
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
	 * 未同期の場合は None を返します。
	 *
	 * @param calendarId - カレンダーID
	 * @returns 最終同期時刻のOption、またはDBエラー
	 */
	async getLastSyncTime(
		calendarId: CalendarId,
	): Promise<Result<Option<Date>, DbError>> {
		const sql = `SELECT last_sync_time FROM calendar_sync_state WHERE calendar_id = ?`;

		try {
			const row = this.db.prepare(sql).get(calendarId) as
				| Pick<SyncStateRow, "last_sync_time">
				| undefined;

			if (!row) {
				return ok(none());
			}

			const date = new Date(row.last_sync_time);
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
			INSERT OR REPLACE INTO calendar_sync_state (calendar_id, last_sync_time, updated_at)
			VALUES (?, ?, datetime('now'))
		`;

		try {
			this.db.prepare(sql).run(calendarId, time.toISOString());
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

	// ============================================================
	// プライベートメソッド
	// ============================================================

	/**
	 * DBの行をCalendarEventに変換
	 *
	 * @param row - calendar_eventsテーブルの行データ
	 * @returns CalendarEventエンティティ
	 */
	private rowToEvent(row: EventRow): CalendarEvent {
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
}
