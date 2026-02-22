-- 認可コードのD1永続化（Workers複数インスタンス対応）
CREATE TABLE IF NOT EXISTS auth_codes (
    code TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    picture TEXT,
    expires_at INTEGER NOT NULL
);
