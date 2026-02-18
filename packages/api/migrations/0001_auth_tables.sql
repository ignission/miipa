-- マイグレーション: 0001_auth_tables
-- 説明: Auth.js v5 + @auth/d1-adapter 標準テーブルを作成
-- 作成日: 2026-02-07
-- 注意: スキーマは @auth/d1-adapter の migrations.js に準拠すること

-- ============================================================
-- Auth.js v5 標準テーブル（@auth/d1-adapter準拠）
-- ============================================================

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS "users" (
  "id" text NOT NULL DEFAULT '',
  "name" text DEFAULT NULL,
  "email" text DEFAULT NULL,
  "emailVerified" datetime DEFAULT NULL,
  "image" text DEFAULT NULL,
  PRIMARY KEY (id)
);

-- アカウントテーブル（OAuthプロバイダ情報）
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text NOT NULL,
  "userId" text NOT NULL DEFAULT NULL,
  "type" text NOT NULL DEFAULT NULL,
  "provider" text NOT NULL DEFAULT NULL,
  "providerAccountId" text NOT NULL DEFAULT NULL,
  "refresh_token" text DEFAULT NULL,
  "access_token" text DEFAULT NULL,
  "expires_at" number DEFAULT NULL,
  "token_type" text DEFAULT NULL,
  "scope" text DEFAULT NULL,
  "id_token" text DEFAULT NULL,
  "session_state" text DEFAULT NULL,
  "oauth_token_secret" text DEFAULT NULL,
  "oauth_token" text DEFAULT NULL,
  PRIMARY KEY (id)
);

-- セッションテーブル（PKはsessionToken）
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" text NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" text NOT NULL DEFAULT NULL,
  "expires" datetime NOT NULL DEFAULT NULL,
  PRIMARY KEY (sessionToken)
);

-- 検証トークンテーブル
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL DEFAULT NULL,
  "expires" datetime NOT NULL DEFAULT NULL,
  PRIMARY KEY (token)
);
