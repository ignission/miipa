-- マイグレーション: 0003_chat_tables
-- 説明: チャットメッセージ履歴テーブルを作成（マルチテナント対応、Cloudflare D1用）
-- 作成日: 2026-02-15

-- ============================================================
-- チャットメッセージ履歴テーブル
-- ============================================================

-- ユーザーごとのAIチャット会話履歴を保存
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created
  ON chat_messages(user_id, created_at);
