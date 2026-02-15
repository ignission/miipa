-- マイグレーション: 0003_refresh_tokens
-- 説明: モバイルアプリ用リフレッシュトークンテーブルを作成
-- 作成日: 2026-02-15

-- ============================================================
-- リフレッシュトークンテーブル
-- ============================================================

-- モバイルアプリのJWT再発行に使用するリフレッシュトークンを保存
-- トークンローテーション方式: 使用済みトークンは都度削除される
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
