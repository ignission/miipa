-- マイグレーション: 003_credentials
-- 説明: 認証情報暗号化ストレージテーブルを作成
-- 作成日: 2026-01-27

-- ============================================================
-- 認証情報テーブル
-- ============================================================

-- 暗号化された認証情報を保存するテーブル
-- マスターキーはmacOS Keychainに保存され、このテーブルには暗号化された値のみ格納
CREATE TABLE IF NOT EXISTS credentials (
    -- 認証情報のキー（例: 'google_oauth_token', 'openai_api_key'）
    key TEXT PRIMARY KEY NOT NULL,
    -- AES-256-GCMで暗号化された値（Base64エンコード）
    encrypted_value TEXT NOT NULL,
    -- 作成日時（ISO 8601形式）
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    -- 更新日時（ISO 8601形式）
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
