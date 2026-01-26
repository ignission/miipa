/**
 * カレンダーイベントキャッシュ用テーブルマイグレーション
 * @module lib/infrastructure/db/migrations/001_calendar_events
 */

import type { Database } from "better-sqlite3";

/**
 * マイグレーションを実行
 *
 * calendar_eventsテーブルとcalendar_sync_stateテーブルを作成し、
 * 効率的なクエリのためのインデックスを追加します。
 *
 * - calendar_events: カレンダーイベントのキャッシュを保存
 * - calendar_sync_state: カレンダーごとの同期状態を管理
 *
 * @param db - better-sqlite3 データベースインスタンス
 */
export function up(db: Database): void {
	// calendar_events テーブル
	// カレンダーイベントのキャッシュを保存
	// 日時はISO8601形式で保存
	db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      calendar_id TEXT NOT NULL,
      title TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_all_day INTEGER NOT NULL DEFAULT 0,
      location TEXT,
      description TEXT,
      source_type TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_account TEXT,
      cached_at TEXT NOT NULL,
      UNIQUE(event_id, calendar_id)
    )
  `);

	// calendar_sync_state テーブル
	// カレンダーごとの最終同期時刻と同期ステータスを管理
	db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_sync_state (
      calendar_id TEXT PRIMARY KEY,
      last_sync_time TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'success'
    )
  `);

	// インデックス: 日時範囲でのクエリを高速化
	db.exec(`
    CREATE INDEX IF NOT EXISTS idx_events_range
    ON calendar_events(start_time, end_time)
  `);

	// インデックス: カレンダーIDでのフィルタリングを高速化
	db.exec(`
    CREATE INDEX IF NOT EXISTS idx_events_calendar
    ON calendar_events(calendar_id)
  `);
}

/**
 * ロールバック
 *
 * calendar_sync_stateテーブルとcalendar_eventsテーブルを削除します。
 * インデックスはテーブル削除時に自動的に削除されます。
 *
 * @param db - better-sqlite3 データベースインスタンス
 */
export function down(db: Database): void {
	db.exec("DROP TABLE IF EXISTS calendar_sync_state");
	db.exec("DROP TABLE IF EXISTS calendar_events");
}
