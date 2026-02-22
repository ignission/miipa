/**
 * イベントリポジトリインターフェース
 *
 * イベントキャッシュの永続化契約を定義します。
 * 実装はインフラ層で行い、ドメイン層は抽象に依存します。
 *
 * @module lib/domain/calendar/repository
 * @example
 * ```typescript
 * // EventRepository の使用例
 * const eventRepo: EventRepository = new SQLiteEventRepository();
 * const eventsResult = await eventRepo.findByRange({
 *   start: new Date('2024-01-01'),
 *   end: new Date('2024-01-31'),
 * });
 * ```
 */

import type { DbError } from "@/lib/domain/shared/errors";
import type { Option } from "@/lib/domain/shared/option";
import type { Result } from "@/lib/domain/shared/result";
import type { CalendarEvent } from "./event";
import type { CalendarId, TimeRange } from "./types";

// ============================================================
// イベントリポジトリ
// ============================================================

/**
 * イベントリポジトリインターフェース（キャッシュ）
 *
 * カレンダーイベントのキャッシュを担当します。
 * SQLiteデータベースに保存し、オフライン時のフォールバックにも使用されます。
 *
 * @example
 * ```typescript
 * class SQLiteEventRepository implements EventRepository {
 *   async findByRange(range: TimeRange): Promise<Result<CalendarEvent[], DbError>> {
 *     // SQLiteから指定期間のイベントを取得
 *   }
 * }
 * ```
 */
export interface EventRepository {
	/**
	 * 時間範囲でイベントを検索
	 *
	 * 指定した期間に開始または終了するイベントを取得します。
	 * 複数カレンダーのイベントが混在して返されます。
	 *
	 * @param range - 検索する時間範囲
	 * @returns イベントの配列、またはDBエラー
	 *
	 * @example
	 * ```typescript
	 * // 今日のイベントを取得
	 * const today = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
	 * const result = await repo.findByRange(today);
	 * ```
	 */
	findByRange(range: TimeRange): Promise<Result<CalendarEvent[], DbError>>;

	/**
	 * カレンダーIDで検索
	 *
	 * 特定のカレンダーに属するすべてのイベントを取得します。
	 *
	 * @param calendarId - 検索するカレンダーのID
	 * @returns イベントの配列、またはDBエラー
	 *
	 * @example
	 * ```typescript
	 * const result = await repo.findByCalendarId(calendarId);
	 * if (isOk(result)) {
	 *   console.log(`${result.value.length} 件のイベントを取得`);
	 * }
	 * ```
	 */
	findByCalendarId(
		calendarId: CalendarId,
	): Promise<Result<CalendarEvent[], DbError>>;

	/**
	 * イベントを一括保存（upsert）
	 *
	 * 複数のイベントを保存します。
	 * 同一ID+カレンダーIDの組み合わせが存在する場合は更新します。
	 *
	 * @param events - 保存するイベントの配列
	 * @returns 成功時はvoid、失敗時はDBエラー
	 *
	 * @example
	 * ```typescript
	 * const events = await googleProvider.getEvents(calendarId, range);
	 * if (isOk(events)) {
	 *   await repo.saveMany(events.value);
	 * }
	 * ```
	 */
	saveMany(events: CalendarEvent[]): Promise<Result<void, DbError>>;

	/**
	 * カレンダーのイベントを全削除
	 *
	 * 指定したカレンダーに属するすべてのイベントを削除します。
	 * カレンダー自体を削除する際のクリーンアップに使用します。
	 *
	 * @param calendarId - 削除対象のカレンダーID
	 * @returns 成功時はvoid、失敗時はDBエラー
	 *
	 * @example
	 * ```typescript
	 * // カレンダー削除時にイベントも削除
	 * await eventRepo.deleteByCalendar(calendarId);
	 * await calendarRepo.delete(calendarId);
	 * ```
	 */
	deleteByCalendar(calendarId: CalendarId): Promise<Result<void, DbError>>;

	/**
	 * 最終同期時刻を取得
	 *
	 * 指定したカレンダーの最終同期時刻を取得します。
	 * 未同期の場合は None を返します。
	 *
	 * @param calendarId - カレンダーID
	 * @returns 最終同期時刻のOption、またはDBエラー
	 *
	 * @example
	 * ```typescript
	 * const result = await repo.getLastSyncTime(calendarId);
	 * if (isOk(result) && isSome(result.value)) {
	 *   const lastSync = result.value.value;
	 *   const needsSync = Date.now() - lastSync.getTime() > 5 * 60 * 1000; // 5分以上経過
	 * }
	 * ```
	 */
	getLastSyncTime(
		calendarId: CalendarId,
	): Promise<Result<Option<Date>, DbError>>;

	/**
	 * 最終同期時刻を更新
	 *
	 * 指定したカレンダーの最終同期時刻を更新します。
	 * 同期完了後に呼び出します。
	 *
	 * @param calendarId - カレンダーID
	 * @param time - 同期時刻
	 * @returns 成功時はvoid、失敗時はDBエラー
	 *
	 * @example
	 * ```typescript
	 * // 同期完了後に時刻を記録
	 * await repo.saveMany(events);
	 * await repo.updateLastSyncTime(calendarId, new Date());
	 * ```
	 */
	updateLastSyncTime(
		calendarId: CalendarId,
		time: Date,
	): Promise<Result<void, DbError>>;

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
	 *
	 * @example
	 * ```typescript
	 * // FK制約対応: イベント保存前にカレンダーレコードを保証
	 * await repo.ensureCalendarRecord(calendarId, name, type, configJson, true);
	 * await repo.saveMany(events);
	 * ```
	 */
	ensureCalendarRecord(
		calendarId: CalendarId,
		name: string,
		type: string,
		config: string,
		isActive: boolean,
	): Promise<Result<void, DbError>>;
}
