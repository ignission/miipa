-- pkce_sessions テーブル
-- OAuth PKCE フローの code_verifier を永続化するためのテーブル
CREATE TABLE IF NOT EXISTS pkce_sessions (
    state TEXT PRIMARY KEY,
    code_verifier TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pkce_sessions_expires_at ON pkce_sessions(expires_at);
