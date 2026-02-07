-- マイグレーション: 0003_merge_duplicate_users
-- 説明: Auth.js JWT戦略でD1Adapterを接続していなかったため、
--       同一メール(shoma@ignission.tech)で3つのuser_idが生成された問題を修正。
--       全データを正規user_idに統合し、重複ユーザーを削除する。
-- 作成日: 2026-02-07
--
-- 正規user_id:  0641aefd-55ae-4aaf-a8a8-c1dda4dd8633（最もデータが多い）
-- 移行元user_id: 0b92db1e-96ec-44f7-b966-1cc5608547c6
--                4dc799bf-d5db-45b2-8be7-ae144af9c639
--
-- 実行方法:
--   wrangler d1 execute <DB名> --remote --file=migrations/0003_merge_duplicate_users.sql
--
-- 注意事項:
--   - 実行前に必ず wrangler d1 export でバックアップを取得すること
--   - D1はSQLiteベースのため、外部キー制約はデフォルトで無効
--   - 複合PKを持つテーブルはINSERT OR REPLACEで重複を解消
--   - ON DELETE CASCADEがあるため、移行元usersの削除は全テーブル移行後に行う

-- ============================================================
-- 事前確認: 移行対象データの存在確認（ドライラン用）
-- ============================================================
-- 以下のSELECTは確認用。wrangler d1 execute では無視されるが、
-- 手動確認時に使用できる。
--
-- SELECT user_id, key, value FROM user_settings
--   WHERE user_id IN (
--     '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
--     '0b92db1e-96ec-44f7-b966-1cc5608547c6',
--     '4dc799bf-d5db-45b2-8be7-ae144af9c639'
--   );

-- ============================================================
-- ステップ1: user_settings の calendars 値をマージ
-- ============================================================
-- 各user_idの calendars キーのJSON配列を結合し、正規IDに保存する。
-- D1 SQLiteにはjson_group_arrayとjson_eachが使えるため、
-- 3ユーザーのcalendars配列を展開→統合→重複排除して再構築する。
--
-- 手順:
--   1a. 一時テーブルに全ユーザーのcalendars JSON要素を展開して格納
--   1b. 重複排除して正規ユーザーのcalendarsを上書き
--   1c. 一時テーブルを削除

-- 1a. 一時テーブルに全calendars要素を展開
CREATE TABLE IF NOT EXISTS _temp_merged_calendars (
  calendar_json TEXT NOT NULL,
  calendar_id TEXT NOT NULL
);

INSERT INTO _temp_merged_calendars (calendar_json, calendar_id)
SELECT
  je.value AS calendar_json,
  json_extract(je.value, '$.id') AS calendar_id
FROM user_settings us, json_each(us.value) je
WHERE us.key = 'calendars'
  AND us.user_id IN (
    '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
    '0b92db1e-96ec-44f7-b966-1cc5608547c6',
    '4dc799bf-d5db-45b2-8be7-ae144af9c639'
  );

-- 1b. 重複排除（同一calendar_idは最初の1件のみ残す）して正規ユーザーに保存
INSERT OR REPLACE INTO user_settings (user_id, key, value, updated_at)
SELECT
  '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
  'calendars',
  '[' || GROUP_CONCAT(calendar_json, ',') || ']',
  datetime('now')
FROM (
  SELECT calendar_json, calendar_id,
         ROW_NUMBER() OVER (PARTITION BY calendar_id ORDER BY ROWID) AS rn
  FROM _temp_merged_calendars
)
WHERE rn = 1;

-- 1c. 一時テーブルを削除
DROP TABLE IF EXISTS _temp_merged_calendars;

-- ============================================================
-- ステップ2: user_settings の calendars 以外のキーを移行
-- ============================================================
-- 移行元ユーザーが持つ calendars 以外の設定（llm_provider等）を
-- 正規ユーザーに移行する。正規ユーザーに既に同じキーがある場合は上書きしない。

INSERT OR IGNORE INTO user_settings (user_id, key, value, updated_at)
SELECT
  '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
  key,
  value,
  datetime('now')
FROM user_settings
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
)
AND key != 'calendars';

-- ============================================================
-- ステップ3: credentials テーブルの移行
-- ============================================================
-- 暗号化された認証情報を正規ユーザーに移行。
-- 複合PK(user_id, key)のため、既に正規ユーザーに同じキーがある場合は
-- REPLACEで上書き（移行元の方が新しい可能性があるため）。

INSERT OR REPLACE INTO credentials (user_id, key, encrypted_value, created_at, updated_at)
SELECT
  '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
  key,
  encrypted_value,
  created_at,
  datetime('now')
FROM credentials
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ4: calendars テーブルの移行
-- ============================================================
-- calendars.id がPKなので、同じカレンダーIDが異なるuser_idで
-- 登録されることは通常ないが、念のためREPLACEで対応。

UPDATE OR IGNORE calendars
SET user_id = '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
    updated_at = datetime('now')
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ5: calendar_events テーブルの移行
-- ============================================================
-- 複合PK(id, calendar_id, user_id)のため、user_idを変更すると
-- PKが変わる。INSERT OR REPLACEで新PKとして挿入し、旧データを削除する。

INSERT OR REPLACE INTO calendar_events (
  id, calendar_id, user_id, title, start_time, end_time,
  is_all_day, location, description, source_type,
  source_calendar_name, source_account_email, created_at, updated_at
)
SELECT
  id, calendar_id,
  '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
  title, start_time, end_time,
  is_all_day, location, description, source_type,
  source_calendar_name, source_account_email, created_at, datetime('now')
FROM calendar_events
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- 移行元のcalendar_eventsを削除（複合PKにuser_idが含まれるため、
-- INSERT OR REPLACEでは旧レコードが残る）
DELETE FROM calendar_events
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ6: calendar_sync_state テーブルの移行
-- ============================================================
-- 複合PK(calendar_id, user_id)のため、calendar_eventsと同様に
-- INSERT OR REPLACEで移行後、旧データを削除する。

INSERT OR REPLACE INTO calendar_sync_state (
  calendar_id, user_id, last_sync_time, updated_at
)
SELECT
  calendar_id,
  '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633',
  last_sync_time,
  datetime('now')
FROM calendar_sync_state
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

DELETE FROM calendar_sync_state
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ7: accounts テーブルの移行
-- ============================================================
-- 移行元ユーザーのOAuthアカウント（Googleプロバイダ）を正規ユーザーに紐付ける。
-- accounts.id がPKなので、userIdを更新するだけでよい。
-- ただし、正規ユーザーに同じprovider+providerAccountIdが既にある場合は
-- 移行元のレコードを削除する（重複回避）。

-- まず、正規ユーザーに既に存在するprovider+providerAccountIdの組を持つ
-- 移行元accountsを削除（重複を防ぐ）
DELETE FROM accounts
WHERE userId IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
)
AND EXISTS (
  SELECT 1 FROM accounts a2
  WHERE a2.userId = '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633'
    AND a2.provider = accounts.provider
    AND a2.providerAccountId = accounts.providerAccountId
);

-- 残りの移行元accountsを正規ユーザーに更新
UPDATE accounts
SET userId = '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633'
WHERE userId IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ8: sessions テーブルの移行（存在する場合）
-- ============================================================
-- JWT戦略のためセッションテーブルは使われていないはずだが、念のため移行

UPDATE OR IGNORE sessions
SET userId = '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633'
WHERE userId IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ9: 移行元の user_settings を削除
-- ============================================================
-- ステップ1-2で正規ユーザーにデータを移行済みのため、
-- 移行元ユーザーの設定を削除する。

DELETE FROM user_settings
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ10: 移行元の credentials を削除
-- ============================================================
-- ステップ3で正規ユーザーにデータを移行済み

DELETE FROM credentials
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ11: 移行元の calendars を削除（残っていれば）
-- ============================================================
-- ステップ4でUPDATE OR IGNOREを使ったため、
-- 万一PKの衝突で更新されなかったレコードを削除する。

DELETE FROM calendars
WHERE user_id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ12: 移行元の users レコードを削除
-- ============================================================
-- 全ての関連データを移行済みのため、重複ユーザーを削除する。
-- ON DELETE CASCADEにより、万一残っていた関連レコードも削除される。

DELETE FROM users
WHERE id IN (
  '0b92db1e-96ec-44f7-b966-1cc5608547c6',
  '4dc799bf-d5db-45b2-8be7-ae144af9c639'
);

-- ============================================================
-- ステップ13: マイグレーション実行記録
-- ============================================================

INSERT OR IGNORE INTO migrations (name, executed_at)
VALUES ('0003_merge_duplicate_users', datetime('now'));

-- ============================================================
-- 事後確認クエリ（手動実行用）
-- ============================================================
-- 以下のクエリで移行結果を確認できる:
--
-- -- 残っているユーザー数の確認
-- SELECT COUNT(*) FROM users WHERE email = 'shoma@ignission.tech';
-- -- 期待値: 1
--
-- -- 正規ユーザーのcalendars設定を確認
-- SELECT value FROM user_settings
--   WHERE user_id = '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633' AND key = 'calendars';
--
-- -- 正規ユーザーの全設定キーを確認
-- SELECT key FROM user_settings
--   WHERE user_id = '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633';
--
-- -- 正規ユーザーのcalendarsテーブルレコード数
-- SELECT COUNT(*) FROM calendars
--   WHERE user_id = '0641aefd-55ae-4aaf-a8a8-c1dda4dd8633';
--
-- -- 移行元ユーザーが完全に削除されたか確認
-- SELECT * FROM users WHERE id IN (
--   '0b92db1e-96ec-44f7-b966-1cc5608547c6',
--   '4dc799bf-d5db-45b2-8be7-ae144af9c639'
-- );
-- -- 期待値: 0行
