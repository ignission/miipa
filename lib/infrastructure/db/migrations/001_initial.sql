-- マイグレーション: 001_initial
-- 説明: miipaの初期テーブルを作成
-- 作成日: 2026-01-26

-- ============================================================
-- マイグレーション管理テーブル
-- ============================================================

-- 実行済みマイグレーションを追跡するテーブル
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    executed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 設定テーブル
-- ============================================================

-- アプリケーション設定をキー・バリュー形式で保存
-- 設定値はJSON文字列として保存される
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 設定テーブルのインデックス
-- キーによる高速検索を実現
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================================
-- 初期データ
-- ============================================================

-- アプリケーションバージョン情報（スキーマ管理用）
INSERT OR IGNORE INTO settings (key, value, updated_at)
VALUES ('schema_version', '"1"', datetime('now'));
