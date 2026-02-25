-- マイグレーション: 0006_users_email_unique
-- 説明: usersテーブルのemailカラムにUNIQUE制約を追加し、重複データを削除
-- 作成日: 2026-02-25
-- 背景: findOrCreateUserがINSERT OR IGNOREを使用していたが、emailにUNIQUE制約がないため
--        毎回新しいユーザーが作成されてしまうバグの修正

-- ============================================================
-- Step 1: 重複ユーザーの削除
-- 各emailグループで「残すべき1件」以外を削除する。
-- 優先順位: user_settingsまたはcredentialsに紐づきがあるユーザー > 最古のrowid
-- ============================================================

DELETE FROM users
WHERE id IN (
    -- 重複emailを持つユーザーのうち、残すべきID以外を取得
    SELECT u.id
    FROM users u
    WHERE u.email IN (
        SELECT email FROM users GROUP BY email HAVING COUNT(*) > 1
    )
    AND u.id NOT IN (
        -- 各emailグループで残すべきユーザーIDを選択
        -- 紐づきがあるユーザーを優先、なければ最古rowidを選択
        SELECT id FROM (
            SELECT
                u2.id,
                u2.email,
                u2.rowid,
                (SELECT COUNT(*) FROM user_settings us WHERE us.user_id = u2.id) +
                (SELECT COUNT(*) FROM credentials c WHERE c.user_id = u2.id) AS ref_count,
                ROW_NUMBER() OVER (
                    PARTITION BY u2.email
                    ORDER BY
                        CASE WHEN (SELECT COUNT(*) FROM user_settings us WHERE us.user_id = u2.id) +
                                  (SELECT COUNT(*) FROM credentials c WHERE c.user_id = u2.id) > 0
                             THEN 0 ELSE 1 END,
                        u2.rowid
                ) AS rn
            FROM users u2
        ) ranked
        WHERE rn = 1
    )
);

-- ============================================================
-- Step 2: emailカラムにUNIQUEインデックスを追加
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
