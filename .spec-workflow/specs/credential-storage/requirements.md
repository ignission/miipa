# Requirements Document: credential-storage

## Introduction

keytarからDB暗号化への認証情報保存方式の移行。macOS Keychain依存を排除し、クラウドデプロイ（Vercel, Fly.io等）を可能にする。業界標準（Cal.com等と同様のAES暗号化 + 環境変数キー方式）に準拠する。

## Alignment with Product Vision

miipaは「npxで簡単に始められる」一人社長向けツール。現在はローカル実行のみだが、スマホからのアクセス需要に対応するためクラウドデプロイが必要。そのための前提条件としてmacOS Keychain依存を排除する。

## 背景

### 現状
- keytarでmacOS Keychainに保存
- 保存対象: LLM APIキー（4種）、Google OAuthトークン
- keytar-adapter.ts（ラッパー）+ token-store.ts（直接使用）の2層構造
- Result型でエラー処理済み

### 課題
- macOS以外（Linux VPS、Docker、Vercel）で動作しない
- keytarはネイティブモジュールでビルド環境依存

### ゴール
- SQLiteにAES-256-GCM暗号化で保存
- 暗号化キーは環境変数（MIIPA_ENCRYPTION_KEY）
- 既存インターフェース（Result型）を維持

## Requirements

### Requirement 1: 暗号化モジュールの実装

**User Story:** 開発者として、認証情報を安全に暗号化/復号化したい。クラウド環境でも動作するように。

#### Acceptance Criteria

1. WHEN 暗号化関数が呼び出される THEN システム SHALL AES-256-GCMで暗号化し、IV + AuthTag + 暗号文を結合して返す
2. WHEN 復号化関数が呼び出される THEN システム SHALL IV + AuthTag + 暗号文を分離し、平文を返す
3. IF MIIPA_ENCRYPTION_KEY環境変数が未設定 THEN システム SHALL 明確なエラーを返す
4. WHEN 不正な暗号文で復号化が試みられる THEN システム SHALL DecryptionError を返す（例外をスローしない）

### Requirement 2: 暗号化認証情報リポジトリの実装

**User Story:** 開発者として、既存のkeytar-adapter.tsと同じインターフェースで暗号化DBにアクセスしたい。

#### Acceptance Criteria

1. WHEN `getSecret(key)` が呼び出される THEN システム SHALL DBから暗号化データを取得し、復号化してResult型で返す
2. WHEN `setSecret(key, value)` が呼び出される THEN システム SHALL 値を暗号化してDBに保存しResult型で返す
3. WHEN `deleteSecret(key)` が呼び出される THEN システム SHALL DBから該当レコードを削除しResult型で返す
4. WHEN `hasSecret(key)` が呼び出される THEN システム SHALL DBにレコードが存在するかbooleanで返す
5. IF DBアクセスエラーが発生 THEN システム SHALL 適切なエラーコードをResult型で返す

### Requirement 3: token-store.tsの統合

**User Story:** 開発者として、Google OAuthトークンも同じ暗号化方式で保存したい。

#### Acceptance Criteria

1. WHEN `saveTokens(accountEmail, tokens)` が呼び出される THEN システム SHALL 暗号化リポジトリ経由でトークンを保存する
2. WHEN `getTokens(accountEmail)` が呼び出される THEN システム SHALL 暗号化リポジトリ経由でトークンを取得する
3. WHEN keytarを直接使用するコードがある THEN システム SHALL それを暗号化リポジトリに置き換える

### Requirement 4: 環境変数ガイダンス

**User Story:** 利用者として、暗号化キーの設定方法を理解したい。

#### Acceptance Criteria

1. IF MIIPA_ENCRYPTION_KEY未設定でアプリ起動 THEN システム SHALL キー生成コマンド例を表示する
2. WHEN セットアップ画面を表示 THEN システム SHALL 暗号化キー設定状態を表示する

### Requirement 5: keytar依存の完全削除

**User Story:** 開発者として、keytarパッケージを完全に削除し、ビルドを簡素化したい。

#### Acceptance Criteria

1. WHEN 移行完了後 THEN システム SHALL package.jsonからkeytarを削除する
2. WHEN keytarをimportするコードがある THEN システム SHALL ビルドエラーになる（残存コードがないことを確認）

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: 暗号化モジュールとリポジトリを分離
- **Modular Design**: 既存のkeytar-adapter.tsと同じインターフェースを維持
- **Dependency Management**: 暗号化はNode.js標準crypto、外部依存なし
- **Clear Interfaces**: Result型を維持し、呼び出し側の変更を最小化

### Performance
- 暗号化/復号化は同期処理で十分高速（1ms未満）
- DBアクセスはSQLite既存の仕組みを使用

### Security
- AES-256-GCM（認証付き暗号化）使用
- IVはレコードごとにランダム生成
- 暗号化キーは環境変数のみ（コード・DBに保存しない）
- 暗号化キーは最低32バイト（256ビット）

### Reliability
- 暗号化キー未設定時は起動時に明確なエラー
- 復号化失敗時はデータ破損として扱い、再認証を促す
- マイグレーション中のデータロスなし

### Usability
- 既存のセットアップフローに変更なし
- 環境変数設定のドキュメント提供
- `openssl rand -base64 32` でキー生成可能

## Out of Scope

- keytar → DB暗号化への自動マイグレーション（新規インストール前提）
- 複数暗号化キーのローテーション対応
- ハードウェアセキュリティモジュール（HSM）対応
