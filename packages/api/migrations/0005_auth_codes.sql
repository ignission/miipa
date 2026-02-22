-- 認可コードのD1永続化（Workers複数インスタンス対応）
CREATE TABLE IF NOT EXISTS auth_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

-- クリーンアップクエリ用インデックス
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires_at ON auth_codes(expires_at);
-- アカウント削除時のクリーンアップ用インデックス
CREATE INDEX IF NOT EXISTS idx_auth_codes_user_id ON auth_codes(user_id);
