-- マイグレーション: 002_calendar_events
-- 説明: カレンダーイベントキャッシュと同期状態テーブルを作成
-- 作成日: 2026-01-26

-- ============================================================
-- カレンダーイベントキャッシュテーブル
-- ============================================================

-- カレンダーイベントをローカルにキャッシュするテーブル
-- オフライン時のフォールバックと高速表示のために使用
CREATE TABLE IF NOT EXISTS calendar_events (
    -- イベントID（プロバイダ側のID）
    id TEXT NOT NULL,
    -- 所属するカレンダーのID
    calendar_id TEXT NOT NULL,
    -- イベントのタイトル
    title TEXT NOT NULL,
    -- 開始日時（ISO 8601形式）
    start_time TEXT NOT NULL,
    -- 終了日時（ISO 8601形式）
    end_time TEXT NOT NULL,
    -- 終日イベントかどうか（0: false, 1: true）
    is_all_day INTEGER NOT NULL DEFAULT 0,
    -- 場所（NULL許容）
    location TEXT,
    -- 説明（NULL許容）
    description TEXT,
    -- ソースの種類（'google' | 'ical'）
    source_type TEXT NOT NULL,
    -- カレンダーの表示名
    source_calendar_name TEXT NOT NULL,
    -- Googleアカウントのメールアドレス（Google Calendar用、NULL許容）
    source_account_email TEXT,
    -- 作成日時
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- 更新日時
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- 複合プライマリキー（同一カレンダー内で一意）
    PRIMARY KEY (id, calendar_id)
);

-- 時間範囲検索用インデックス
CREATE INDEX IF NOT EXISTS idx_calendar_events_time_range
    ON calendar_events(start_time, end_time);

-- カレンダーID検索用インデックス
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id
    ON calendar_events(calendar_id);

-- ============================================================
-- カレンダー同期状態テーブル
-- ============================================================

-- 各カレンダーの最終同期時刻を管理するテーブル
CREATE TABLE IF NOT EXISTS calendar_sync_state (
    -- カレンダーID
    calendar_id TEXT PRIMARY KEY NOT NULL,
    -- 最終同期時刻（ISO 8601形式）
    last_sync_time TEXT NOT NULL,
    -- 更新日時
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
