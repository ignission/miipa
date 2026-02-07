-- マイグレーション: 0002_soloday_tables
-- 説明: SoloDay固有テーブルを作成（マルチテナント対応、Cloudflare D1用）
-- 作成日: 2026-02-07

-- ============================================================
-- ユーザー設定テーブル
-- ============================================================

-- ユーザーごとの設定をキー・バリュー形式で保存
CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================
-- カレンダーテーブル
-- ============================================================

-- カレンダー設定（マルチテナント対応）
CREATE TABLE IF NOT EXISTS calendars (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);

-- ============================================================
-- カレンダーイベントキャッシュテーブル
-- ============================================================

-- カレンダーイベントをキャッシュするテーブル（マルチテナント対応）
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_all_day INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  description TEXT,
  source_type TEXT NOT NULL,
  source_calendar_name TEXT NOT NULL,
  source_account_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (id, calendar_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time_range
  ON calendar_events(user_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id
  ON calendar_events(calendar_id);

-- ============================================================
-- カレンダー同期状態テーブル
-- ============================================================

-- 各カレンダーの最終同期時刻を管理（マルチテナント対応）
CREATE TABLE IF NOT EXISTS calendar_sync_state (
  calendar_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  last_sync_time TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (calendar_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
);

-- ============================================================
-- 認証情報テーブル
-- ============================================================

-- 暗号化された認証情報を保存（マルチテナント対応）
CREATE TABLE IF NOT EXISTS credentials (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, key),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);

-- ============================================================
-- マイグレーション管理テーブル
-- ============================================================

-- 実行済みマイグレーションを追跡
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  executed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
