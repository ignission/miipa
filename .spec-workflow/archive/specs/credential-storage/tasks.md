# Tasks Document: credential-storage

## Phase 1: 暗号化基盤

- [x] 1. 暗号化モジュールの型定義作成
  - File: lib/infrastructure/crypto/types.ts
  - CryptoError型、CryptoErrorCode型、EncryptedData型を定義
  - エラーファクトリ関数を実装
  - Purpose: 暗号化処理の型安全性を確保
  - _Leverage: lib/domain/shared/errors.ts, lib/domain/shared/result.ts_
  - _Requirements: 1.1, 1.4_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer specializing in type systems | Task: Create crypto/types.ts with CryptoError, CryptoErrorCode (ENCRYPTION_KEY_MISSING, ENCRYPTION_KEY_INVALID, ENCRYPTION_FAILED, DECRYPTION_FAILED), EncryptedData interface, and error factory functions following existing patterns in lib/domain/shared/errors.ts | Restrictions: Do not modify existing error types, follow discriminated union pattern, use readonly properties | Success: All types compile, error factories create proper CryptoError objects, follows existing codebase patterns | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 2. 暗号化・復号化関数の実装
  - File: lib/infrastructure/crypto/encryption.ts
  - AES-256-GCM暗号化・復号化を実装
  - 環境変数からの暗号化キー取得を実装
  - シリアライズ・デシリアライズ関数を実装
  - Purpose: 認証情報の暗号化処理を提供
  - _Leverage: lib/infrastructure/crypto/types.ts, lib/domain/shared/result.ts_
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Security Engineer with Node.js crypto expertise | Task: Create encryption.ts with encrypt(), decrypt(), getEncryptionKey(), serialize(), deserialize() functions using AES-256-GCM, 12-byte IV, 16-byte AuthTag, returning Result types | Restrictions: Use Node.js crypto only (no external deps), never log plaintext or keys, handle all crypto errors gracefully | Success: Encryption/decryption roundtrip works, invalid data returns Err, missing env var returns clear error message | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 3. cryptoモジュールのindex.ts作成
  - File: lib/infrastructure/crypto/index.ts
  - 公開APIをエクスポート
  - Purpose: モジュールの公開インターフェースを定義
  - _Leverage: lib/infrastructure/crypto/encryption.ts, lib/infrastructure/crypto/types.ts_
  - _Requirements: 1.1_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Create crypto/index.ts exporting encrypt, decrypt, getEncryptionKey, serialize, deserialize, CryptoError, CryptoErrorCode, EncryptedData | Restrictions: Only export public API, do not re-export internal helpers | Success: All required symbols are exported and importable | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

## Phase 2: データベース

- [x] 4. credentialsテーブルのマイグレーション作成
  - File: lib/infrastructure/db/migrations/003_credentials.sql
  - credentials テーブル定義（key, encrypted_value, created_at, updated_at）
  - Purpose: 暗号化された認証情報の永続化
  - _Leverage: lib/infrastructure/db/migrations/002_calendar_events.sql_
  - _Requirements: 2.1, 2.2_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Database Engineer | Task: Create 003_credentials.sql with credentials table (key TEXT PRIMARY KEY, encrypted_value TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL) | Restrictions: Follow existing migration naming pattern, use TEXT for dates (ISO 8601), no foreign keys needed | Success: Migration runs without errors, table is created with correct schema | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

## Phase 3: シークレットリポジトリ

- [x] 5. シークレットリポジトリの型定義作成
  - File: lib/infrastructure/secret/types.ts
  - SecretKey型（LLMSecretKey + 動的Google OAuthキー）
  - SecretError型、SecretErrorCode型を定義
  - Purpose: シークレット管理の型安全性を確保
  - _Leverage: lib/infrastructure/keychain/types.ts, lib/domain/shared/errors.ts_
  - _Requirements: 2.1, 2.5_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Create secret/types.ts with SecretKey (LLMSecretKey union + template literal for google-oauth-${string}), SecretError, SecretErrorCode (including crypto errors), error factory functions | Restrictions: Maintain compatibility with existing keychain/types.ts key names, use discriminated unions | Success: All types compile, supports both static LLM keys and dynamic Google OAuth keys | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 6. シークレットリポジトリの実装
  - File: lib/infrastructure/secret/secret-repository.ts
  - getSecret, setSecret, deleteSecret, hasSecret, getSecrets を実装
  - keytar-adapter.tsと同一インターフェース
  - Purpose: 暗号化DBへのCRUD操作を提供
  - _Leverage: lib/infrastructure/crypto/, lib/infrastructure/db/connection.ts, lib/infrastructure/keychain/keytar-adapter.ts_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with Repository pattern expertise | Task: Create secret-repository.ts implementing getSecret, setSecret, deleteSecret, hasSecret, getSecrets with same signatures as keytar-adapter.ts, using crypto module for encryption and SQLite for storage | Restrictions: Return Result<Option<string>, SecretError> for getSecret, handle all DB and crypto errors, use getDatabase() for DB access | Success: All functions work correctly, encrypted data stored in DB, decryption returns original value | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 7. secretモジュールのindex.ts作成
  - File: lib/infrastructure/secret/index.ts
  - 公開APIをエクスポート
  - Purpose: モジュールの公開インターフェースを定義
  - _Leverage: lib/infrastructure/secret/secret-repository.ts, lib/infrastructure/secret/types.ts_
  - _Requirements: 2.1_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Create secret/index.ts exporting getSecret, setSecret, deleteSecret, hasSecret, getSecrets, SecretKey, SecretError, SecretErrorCode | Restrictions: Only export public API | Success: All required symbols are exported and importable | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

## Phase 4: エラー型の追加

- [x] 8. 共有エラー型にCryptoError, SecretErrorを追加
  - File: lib/domain/shared/errors.ts
  - CryptoError, SecretError型をAppErrorの仲間として追加
  - Purpose: エラー型の一元管理
  - _Leverage: lib/domain/shared/errors.ts (既存パターン)_
  - _Requirements: 1.4, 2.5_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Add CryptoErrorCode, CryptoError, SecretErrorCode, SecretError types to errors.ts following existing KeychainError pattern, add error factory functions | Restrictions: Do not modify existing error types, maintain backward compatibility | Success: New error types follow same pattern as KeychainError, type guards work correctly | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

## Phase 5: 依存関係切り替え

- [x] 9. token-store.tsをsecret-repository経由に変更
  - File: lib/infrastructure/calendar/token-store.ts
  - keytarの直接使用を削除
  - secret-repository経由でトークン保存・取得
  - Purpose: Google OAuthトークンも暗号化DBに統合
  - _Leverage: lib/infrastructure/secret/, lib/infrastructure/calendar/token-store.ts (既存)_
  - _Requirements: 3.1, 3.2, 3.3_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer | Task: Modify token-store.ts to use secret-repository instead of keytar directly, change import from keytar to ../secret, update saveTokens/getTokens/deleteTokens/hasTokens to use setSecret/getSecret/deleteSecret/hasSecret | Restrictions: Maintain same public interface, keep isTokenExpired unchanged, preserve error handling behavior | Success: Token operations work via secret-repository, no keytar import remains | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 10. save-setup-settings.tsのimport変更
  - File: lib/application/setup/save-setup-settings.ts
  - keychain/からsecret/へimportパス変更
  - エラー型のマッピング調整
  - Purpose: アプリケーション層の依存関係更新
  - _Leverage: lib/infrastructure/secret/, lib/application/setup/save-setup-settings.ts (既存)_
  - _Requirements: 5.1_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer | Task: Update save-setup-settings.ts to import from ../infrastructure/secret instead of ../infrastructure/keychain, update error type references from KeychainError to SecretError | Restrictions: Maintain same business logic, only change imports and error types | Success: File compiles, imports from secret module, error handling works | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 11. check-setup-status.tsのimport変更
  - File: lib/application/setup/check-setup-status.ts
  - keychain/からsecret/へimportパス変更
  - Purpose: アプリケーション層の依存関係更新
  - _Leverage: lib/infrastructure/secret/, lib/application/setup/check-setup-status.ts (既存)_
  - _Requirements: 5.1_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer | Task: Update check-setup-status.ts to import from ../infrastructure/secret instead of ../infrastructure/keychain | Restrictions: Maintain same business logic, only change imports | Success: File compiles, imports from secret module | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

## Phase 6: 環境変数ガイダンス

- [x] 12. 暗号化キー未設定時のエラーメッセージ改善
  - File: lib/infrastructure/crypto/encryption.ts (getEncryptionKey関数)
  - 明確なエラーメッセージとキー生成コマンド例を含める
  - Purpose: 利用者が暗号化キーを設定できるようにする
  - _Leverage: lib/infrastructure/crypto/encryption.ts_
  - _Requirements: 4.1_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Developer Experience Engineer | Task: Ensure getEncryptionKey() returns helpful error message including: 1) What MIIPA_ENCRYPTION_KEY is for, 2) How to generate it (openssl rand -base64 32), 3) Where to set it (.env file or environment) | Restrictions: Error message should be concise but complete | Success: Error message guides user to successfully set up encryption key | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

## Phase 7: keytar削除

- [x] 13. keychainディレクトリの削除
  - Files: lib/infrastructure/keychain/ (全ファイル削除)
  - keytar-adapter.ts, types.ts, index.ts を削除
  - Purpose: 古い実装の完全削除
  - _Leverage: なし_
  - _Requirements: 5.1, 5.2_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Developer | Task: Delete entire lib/infrastructure/keychain/ directory including keytar-adapter.ts, types.ts, index.ts, .gitkeep | Restrictions: Ensure no other files import from this directory first (verify with grep) | Success: Directory deleted, no import errors | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 14. package.jsonからkeytar削除
  - File: package.json
  - keytarパッケージを依存関係から削除
  - Purpose: ネイティブモジュール依存の排除
  - _Leverage: package.json_
  - _Requirements: 5.1, 5.2_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Developer | Task: Remove keytar from package.json dependencies, run npm install to update package-lock.json | Restrictions: Only remove keytar, do not modify other dependencies | Success: keytar removed, npm install succeeds, no keytar in node_modules | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

## Phase 8: 動作確認

- [x] 15. ビルド確認とLint修正
  - Files: 全体
  - npm run build でビルド確認
  - npx biome check --write . でLint修正
  - Purpose: 実装の品質確認
  - _Leverage: なし_
  - _Requirements: 5.2_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Developer | Task: Run npm run build to verify no compile errors, run npx biome check --write . to fix any lint issues | Restrictions: Fix all errors before marking complete | Success: Build succeeds, no lint errors | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_

- [x] 16. 手動動作確認
  - 環境変数設定 → npm run dev → セットアップフロー → LLM APIキー保存 → 再起動後も読み込めることを確認
  - Purpose: エンドツーエンドの動作確認
  - _Requirements: All_
  - _Prompt: Implement the task for spec credential-storage, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer | Task: 1) Set MIIPA_ENCRYPTION_KEY env var, 2) Run npm run dev, 3) Complete setup flow with LLM API key, 4) Restart app, 5) Verify API key is still available | Restrictions: Document any issues found | Success: Full flow works, data persists across restarts | After completion: Mark task as [-] in tasks.md before starting, use log-implementation tool to record artifacts, then mark as [x]_
