/**
 * カレンダーリポジトリインターフェース
 *
 * カレンダー設定とイベントキャッシュの永続化契約を定義します。
 * 実装はインフラ層で行い、ドメイン層は抽象に依存します。
 *
 * @module lib/domain/calendar/repository
 * @example
 * ```typescript
 * // CalendarRepository の使用例
 * const calendarRepo: CalendarRepository = new ConfigCalendarRepository();
 * const result = await calendarRepo.findAll();
 * if (isOk(result)) {
 *   console.log(`${result.value.length} 件のカレンダー設定を取得`);
 * }
 *
 * // EventRepository の使用例
 * const eventRepo: EventRepository = new SQLiteEventRepository();
 * const eventsResult = await eventRepo.findByRange({
 *   start: new Date('2024-01-01'),
 *   end: new Date('2024-01-31'),
 * });
 * ```
 */

import type { ConfigError, DbError } from "@/lib/domain/shared/errors";
import type { Option } from "@/lib/domain/shared/option";
import type { Result } from "@/lib/domain/shared/result";
import type { CalendarEvent } from "./event";
import type { CalendarConfig, CalendarId, TimeRange } from "./types";

// ============================================================
// カレンダー設定リポジトリ
// ============================================================

/**
 * カレンダー設定リポジトリインターフェース
 *
 * カレンダー設定の永続化を担当します。
 * 設定は config.json の calendars 配列に保存されます。
 *
 * @example
 * ```typescript
 * class ConfigCalendarRepository implements CalendarRepository {
 *   async findAll(): Promise<Result<CalendarConfig[], ConfigError>> {
 *     // config.json から calendars を読み込む
 *   }
 * }
 * ```
 */
export interface CalendarRepository {
	/**
	 * 全カレンダー設定を取得
	 *
	 * 登録されているすべてのカレンダー設定を返します。
	 * 設定ファイルが存在しない場合は空配列を返します。
	 *
	 * @returns カレンダー設定の配列、または設定エラー
	 *
	 * @example
	 * ```typescript
	 * const result = await repo.findAll();
	 * if (isOk(result)) {
	 *   const enabledCalendars = result.value.filter(c => c.enabled);
	 * }
	 * ```
	 */
	findAll(): Promise<Result<CalendarConfig[], ConfigError>>;

	/**
	 * カレンダー設定を保存
	 *
	 * 新規作成または既存設定の更新を行います。
	 * IDが一致する設定が存在する場合は上書きします。
	 *
	 * @param calendar - 保存するカレンダー設定
	 * @returns 成功時はvoid、失敗時は設定エラー
	 *
	 * @example
	 * ```typescript
	 * const newCalendar: CalendarConfig = {
	 *   id: createCalendarId(),
	 *   type: 'google',
	 *   name: '仕事用',
	 *   enabled: true,
	 *   googleAccountEmail: 'user@example.com',
	 * };
	 * await repo.save(newCalendar);
	 * ```
	 */
	save(calendar: CalendarConfig): Promise<Result<void, ConfigError>>;

	/**
	 * カレンダー設定を削除
	 *
	 * 指定したIDのカレンダー設定を削除します。
	 * 存在しないIDを指定した場合もエラーにはなりません。
	 *
	 * @param id - 削除するカレンダーのID
	 * @returns 成功時はvoid、失敗時は設定エラー
	 *
	 * @example
	 * ```typescript
	 * const result = await repo.delete(calendarId);
	 * if (isErr(result)) {
	 *   console.error('削除に失敗:', result.error.message);
	 * }
	 * ```
	 */
	delete(id: CalendarId): Promise<Result<void, ConfigError>>;

	/**
	 * IDでカレンダー設定を取得
	 *
	 * 指定したIDのカレンダー設定を検索します。
	 * 存在しない場合は None を返します。
	 *
	 * @param id - 検索するカレンダーのID
	 * @returns カレンダー設定のOption、または設定エラー
	 *
	 * @example
	 * ```typescript
	 * const result = await repo.findById(calendarId);
	 * if (isOk(result) && isSome(result.value)) {
	 *   const calendar = result.value.value;
	 *   console.log(`カレンダー名: ${calendar.name}`);
	 * }
	 * ```
	 */
	findById(
		id: CalendarId,
	): Promise<Result<Option<CalendarConfig>, ConfigError>>;
}

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
}
