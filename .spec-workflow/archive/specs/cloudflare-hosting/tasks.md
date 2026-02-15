# Tasks Document: cloudflare-hosting

## Phase 1: 基盤準備

- [x] 1. OpenNextとWrangler設定ファイル作成
  - Files: `wrangler.toml`（新規）, `open-next.config.ts`（新規）, `.gitignore`（更新）
  - Cloudflare Workers + OpenNextでNext.jsをホスティングするための設定ファイルを作成
  - Purpose: Next.jsアプリをCloudflare Workers上で動作させる基盤を構築する
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: インフラエンジニア | Task: wrangler.toml（D1バインディング名: DB, database_id: TODO）、open-next.config.ts（Cloudflare Workers最適化設定）、.gitignoreに.wrangler/, .dev.varsを追加 | Restrictions: wrangler.toml内のdatabase_idはプレースホルダー（<UUID>）で記載。本番では実際のD1 UUIDに置き換える必要があることをコメントで明記 | _Leverage: なし（新規作成） | _Requirements: REQ-1 | Success: wrangler dev でローカルサーバーが起動でき、D1バインディングが参照できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 2. package.json依存関係追加
  - File: `package.json`
  - Cloudflare移行に必要な依存関係を追加し、開発スクリプトを更新
  - Purpose: Cloudflare環境で必要なパッケージをインストールし、開発・ビルドコマンドを更新する
  - _Leverage: 既存のpackage.json_
  - _Requirements: REQ-1, REQ-2_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: フロントエンドエンジニア | Task: package.jsonに追加: dependencies: @opennextjs/cloudflare, @cloudflare/workers-types, @auth/d1-adapter, next-auth@beta（v5）; devDependencies: wrangler; scripts更新: dev, build, deploy | Restrictions: 既存依存関係は削除しない。better-sqlite3, keytarは後のタスクで削除 | _Leverage: 既存のpackage.json | _Requirements: REQ-1, REQ-2 | Success: npm installが成功し、型エラーが発生しないこと | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 3. D1マイグレーションSQL作成
  - Files: `migrations/0001_auth_tables.sql`（新規）, `migrations/0002_soloday_tables.sql`（新規）
  - Auth.js標準テーブルとSoloDay固有テーブルのマイグレーションSQLを作成。マルチテナント対応
  - Purpose: D1データベーススキーマを定義し、マルチテナント対応のデータ構造を構築する
  - _Leverage: lib/infrastructure/db/migrations/（既存SQLを参考）_
  - _Requirements: REQ-2, REQ-4_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: データベースエンジニア | Task: migrations/0001_auth_tables.sql（Auth.js標準: users, accounts, sessions, verification_tokens）、migrations/0002_soloday_tables.sql（user_settings, calendars, calendar_events, calendar_sync_state, credentials）を作成。user_id + FOREIGN KEY + ON DELETE CASCADE。適切なインデックスを作成 | Restrictions: design.mdのスキーマ定義に準拠 | _Leverage: lib/infrastructure/db/migrations/ | _Requirements: REQ-2, REQ-4 | Success: wrangler d1 migrations apply soloday-db --localでマイグレーションが成功すること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

## Phase 2: インフラ層移行

- [x] 4. Cloudflareバインディングヘルパー作成
  - File: `lib/infrastructure/cloudflare/bindings.ts`（新規）
  - Cloudflare環境（D1、Secrets）へのアクセスを抽象化するヘルパー関数を作成
  - Purpose: Cloudflareバインディングへのアクセスを一元管理し、エラーハンドリングを統一する
  - _Leverage: lib/domain/shared/result.ts_
  - _Requirements: REQ-1, REQ-4_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: lib/infrastructure/cloudflare/bindings.tsを作成。getD1Database(): Result<D1Database, DatabaseError>、getEncryptionKey(): Result<string, ConfigError>を実装 | Restrictions: Result型を使用 | _Leverage: lib/domain/shared/result.ts | _Requirements: REQ-1, REQ-4 | Success: 型エラーなくビルドでき、D1Databaseが正しく取得できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 5. Web Crypto API暗号化モジュール作成
  - File: `lib/infrastructure/crypto/web-crypto-encryption.ts`（新規）
  - node:cryptoからWeb Crypto APIへ移行。AES-256-GCM暗号化/復号化を実装
  - Purpose: Cloudflare Workers環境で動作する暗号化モジュールを提供する
  - _Leverage: lib/infrastructure/crypto/encryption.ts（既存ロジックを参考）_
  - _Requirements: REQ-5_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: セキュリティエンジニア | Task: lib/infrastructure/crypto/web-crypto-encryption.tsを作成。importEncryptionKey(): Promise<Result<CryptoKey, CryptoError>>、encrypt(plaintext, key): Promise<Result<EncryptedData, CryptoError>>、decrypt(encrypted, key): Promise<Result<string, CryptoError>>を実装 | Restrictions: Web Crypto APIのみ使用（node:crypto禁止）。Uint8Array使用。Result型でエラーハンドリング | _Leverage: lib/infrastructure/crypto/encryption.ts | _Requirements: REQ-5 | Success: 暗号化→復号化が正しく動作すること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 6. D1コネクション管理作成
  - File: `lib/infrastructure/db/d1-connection.ts`（新規）
  - D1バインディングラッパーを作成。自動マイグレーションは削除（wrangler d1 migrations applyで手動実行）
  - Purpose: D1データベースへのアクセスを抽象化し、エラーハンドリングを統一する
  - _Leverage: lib/infrastructure/db/connection.ts（既存構造を参考）, lib/infrastructure/cloudflare/bindings.ts_
  - _Requirements: REQ-4_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: データベースエンジニア | Task: lib/infrastructure/db/d1-connection.tsを作成。getD1Connection(): Result<D1Database, DatabaseError>を実装 | Restrictions: 自動マイグレーション機能は実装しない | _Leverage: lib/infrastructure/db/connection.ts, lib/infrastructure/cloudflare/bindings.ts | _Requirements: REQ-4 | Success: D1Databaseが正しく取得できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 7. D1EventRepository作成
  - File: `lib/infrastructure/db/d1-event-repository.ts`（新規）
  - EventRepositoryインターフェースの非同期D1実装。マルチテナント対応（userId追加）
  - Purpose: D1を使用したイベントリポジトリを実装し、マルチテナント対応のデータアクセスを提供する
  - _Leverage: lib/infrastructure/db/event-repository.ts（既存SQL、rowToEventロジックを再利用）_
  - _Requirements: REQ-4_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: lib/infrastructure/db/d1-event-repository.tsを作成。D1EventRepositoryクラス実装。全メソッドにuserId追加。SQL文に"WHERE user_id = ?"追加。同期→非同期API変更。トランザクションをdb.batch()に変更 | Restrictions: EventRepositoryインターフェースは変更しない。既存SQLを最大限再利用。Result型 | _Leverage: lib/infrastructure/db/event-repository.ts | _Requirements: REQ-4 | Success: マルチテナント分離が機能すること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 8. D1SecretRepository作成
  - File: `lib/infrastructure/secret/d1-secret-repository.ts`（新規）
  - マルチテナント対応のシークレットリポジトリ。Web Crypto API暗号化モジュールを使用
  - Purpose: マルチテナント対応の暗号化シークレット管理を提供する
  - _Leverage: lib/infrastructure/crypto/web-crypto-encryption.ts_
  - _Requirements: REQ-3, REQ-5_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: セキュリティエンジニア | Task: lib/infrastructure/secret/d1-secret-repository.tsを作成。D1SecretRepositoryクラス（constructor(db, encryptionKey)）。getSecret(userId, key), setSecret(userId, key, value), deleteSecret(userId, key), hasSecret(userId, key)を実装 | Restrictions: Web Crypto API暗号化モジュールを使用。Result型 | _Leverage: lib/infrastructure/crypto/web-crypto-encryption.ts | _Requirements: REQ-3, REQ-5 | Success: 暗号化されたシークレットがD1に保存・取得できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 9. D1ConfigRepository作成
  - File: `lib/infrastructure/config/d1-config-repository.ts`（新規）
  - D1ベースのアプリケーション設定管理リポジトリ。user_settingsテーブルを使用
  - Purpose: マルチテナント対応のアプリケーション設定管理を提供する
  - _Leverage: lib/config/loader.ts（既存の設定スキーマを参考）_
  - _Requirements: REQ-4_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: lib/infrastructure/config/d1-config-repository.tsを作成。UserSettings型定義（llmProvider, llmModel, theme）。D1ConfigRepository（getSettings, saveSettings, getSetting, setSetting）を実装 | Restrictions: Result型とOption型を使用 | _Leverage: lib/config/loader.ts | _Requirements: REQ-4 | Success: ユーザー設定がD1に保存・取得できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

## Phase 3: 認証

- [x] 10. Auth.js v5設定
  - Files: `auth.config.ts`（新規）, `auth.ts`（新規）
  - Auth.js v5の設定ファイルを作成。D1Adapter、Googleプロバイダ、セッションコールバック設定
  - Purpose: Auth.js v5によるマルチテナント認証を構築する
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: 認証エンジニア | Task: auth.config.tsにcreateAuthConfig(db: D1Database): NextAuthConfig関数を実装（D1Adapter, Googleプロバイダ, セッション戦略: "database"）。auth.tsでauth()関数をエクスポート | Restrictions: next-auth@beta（v5）使用。GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET環境変数 | _Leverage: なし（新規作成） | _Requirements: REQ-2 | Success: Auth.js設定が型エラーなくビルドできること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 11. 認証ミドルウェア作成
  - File: `middleware.ts`（新規）
  - Next.js App Router用の認証ミドルウェア。未認証→/auth/signinにリダイレクト
  - Purpose: すべてのページで認証を強制し、未認証ユーザーをログイン画面にリダイレクトする
  - _Leverage: auth.ts_
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: middleware.tsを作成。auth()からセッション取得、未認証なら/auth/signinにリダイレクト。matcherで/auth/*, /_next/static/*, favicon.icoを除外 | Restrictions: Next.js App Router形式に準拠 | _Leverage: auth.ts | _Requirements: REQ-2 | Success: 未認証でアクセスすると/auth/signinにリダイレクトされること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 12. サインインページ作成
  - File: `app/auth/signin/page.tsx`（新規）
  - Google OAuthサインインページ。ミーアキャットキャラクターとSoloDayロゴ表示
  - Purpose: ユーザーにGoogle OAuthログインUIを提供する
  - _Leverage: app/setup/page.tsx（既存UIパターンを参考）_
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: フロントエンドエンジニア | Task: app/auth/signin/page.tsxを作成。ミーアキャットキャラクター画像、"SoloDayへようこそ"メッセージ、"Sign in with Google"ボタン（signIn('google', { callbackUrl: '/' })）。Panda CSS + Park UIでスタイリング | Restrictions: 既存デザインシステムに準拠。日本語UI | _Leverage: app/setup/page.tsx | _Requirements: REQ-2 | Success: ページ表示→ボタンクリック→Google OAuth画面遷移 | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

## Phase 4: アプリケーション層

- [x] 13. CalendarContext（DIコンテキスト）作成
  - File: `lib/context/calendar-context.ts`（新規）
  - 依存性注入コンテキスト。リポジトリのインスタンス管理を一元化
  - Purpose: リポジトリのインスタンス管理を一元化し、依存性注入を実現する
  - _Leverage: lib/infrastructure/db/d1-event-repository.ts, lib/infrastructure/config/d1-config-repository.ts, lib/infrastructure/secret/d1-secret-repository.ts_
  - _Requirements: REQ-4_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: lib/context/calendar-context.tsを作成。CalendarContext型定義（eventRepository, configRepository, secretRepository）。createCalendarContext(db, userId, encryptionKey): Promise<Result<CalendarContext, Error>>を実装 | Restrictions: Result型でエラーハンドリング | _Leverage: D1リポジトリ群 | _Requirements: REQ-4 | Success: createCalendarContext()が正しくCalendarContextを返すこと | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 14. ユースケース修正（get-events, sync-calendars等）
  - Files: `lib/application/calendar/get-events.ts`, `sync-calendars.ts`, `add-google-calendar.ts`, `add-ical-calendar.ts`
  - すべてのユースケースにuserId追加。非同期API対応
  - Purpose: ユースケースをマルチテナント対応に修正する
  - _Leverage: 既存のユースケースロジック_
  - _Requirements: REQ-3, REQ-4, REQ-6_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: lib/application/calendar/の各ファイルを修正。すべての関数にuserId: string追加。リポジトリ呼び出しにuserIdを渡す。非同期API対応（await） | Restrictions: 既存ビジネスロジックは変更しない。Result型 | _Leverage: 既存のユースケースロジック | _Requirements: REQ-3, REQ-4, REQ-6 | Success: 型エラーなくビルドできること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

## Phase 5: API層移行

- [x] 15. APIルート修正（/api/events）
  - File: `app/api/events/route.ts`
  - auth()からセッション取得、D1コンテキスト作成、userIdでフィルタ
  - Purpose: イベント取得APIをマルチテナント対応に修正する
  - _Leverage: 既存APIロジック, lib/application/calendar/get-events.ts_
  - _Requirements: REQ-2, REQ-4, REQ-6_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: app/api/events/route.tsを修正。auth()でセッション取得→未認証なら401→getD1Connection()→createCalendarContext()→getEvents(session.user.id, range) | Restrictions: 既存エラーハンドリング維持。Result型 | _Leverage: 既存APIロジック | _Requirements: REQ-2, REQ-4, REQ-6 | Success: 認証済みユーザーが自分のイベントのみ取得できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 16. APIルート修正（/api/calendars, /api/calendars/[id]）
  - Files: `app/api/calendars/route.ts`, `app/api/calendars/[id]/route.ts`
  - GET/POST/DELETEハンドラーにauth()とuserId追加
  - Purpose: カレンダー管理APIをマルチテナント対応に修正する
  - _Leverage: 既存APIロジック_
  - _Requirements: REQ-2, REQ-3, REQ-4, REQ-6_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: app/api/calendars/route.ts, [id]/route.tsを修正。auth()→401チェック→D1コンテキスト→session.user.idでフィルタ | Restrictions: 既存エラーハンドリング維持 | _Leverage: 既存APIロジック | _Requirements: REQ-2, REQ-3, REQ-4, REQ-6 | Success: 認証済みユーザーが自分のカレンダーのみ操作できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 17. APIルート修正（/api/calendars/google, /api/calendars/ical, /api/calendars/sync）
  - Files: `app/api/calendars/google/route.ts`, `app/api/calendars/ical/route.ts`, `app/api/calendars/sync/route.ts`
  - ユースケース呼び出しにuserId追加
  - Purpose: カレンダー追加・同期APIをマルチテナント対応に修正する
  - _Leverage: 既存APIロジック, lib/application/calendar/*_
  - _Requirements: REQ-2, REQ-3, REQ-4, REQ-6_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: google/route.ts, ical/route.ts, sync/route.tsを修正。auth()→401チェック→D1コンテキスト→ユースケース(session.user.id, ...) | Restrictions: 既存エラーハンドリング維持 | _Leverage: 既存APIロジック | _Requirements: REQ-2, REQ-3, REQ-4, REQ-6 | Success: 認証済みユーザーが自分のカレンダーのみ追加・同期できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 18. APIルート修正（/api/setup/*, /api/auth/google/callback）
  - Files: `app/api/setup/check-status/route.ts`, `save-settings/route.ts`, `validate-key/route.ts`, `app/api/auth/google/callback/route.ts`
  - セットアップAPIとOAuthコールバックにauth()とuserId追加
  - Purpose: セットアップAPIとOAuthコールバックをマルチテナント対応に修正する
  - _Leverage: 既存APIロジック_
  - _Requirements: REQ-2, REQ-3, REQ-4, REQ-6_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: setup/check-status, save-settings, validate-key, auth/google/callbackを修正。auth()→401チェック→D1コンテキスト→session.user.idでフィルタ | Restrictions: 既存エラーハンドリング維持 | _Leverage: 既存APIロジック | _Requirements: REQ-2, REQ-3, REQ-4, REQ-6 | Success: 認証済みユーザーが自分の設定のみ操作できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

## Phase 6: PWA対応

- [x] 19. manifest.json + Service Worker作成
  - Files: `public/manifest.json`（新規）, `public/sw.js`（新規）
  - PWA manifestとService Workerを作成。Cache-First戦略
  - Purpose: PWA対応してモバイルデバイスからネイティブアプリのようにアクセスできるようにする
  - _Requirements: REQ-7_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: フロントエンドエンジニア | Task: public/manifest.json（name: "SoloDay", theme_color: "#F59E0B", display: "standalone", icons）、public/sw.js（Cache-First戦略で静的アセットをキャッシュ） | Restrictions: Service WorkerはES5互換。W3C仕様準拠 | _Leverage: なし（新規作成） | _Requirements: REQ-7 | Success: LighthouseでPWAスコアが良好であること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 20. PWAメタタグとアイコン設定
  - Files: `app/layout.tsx`, `public/icons/`（アイコン追加）
  - layout.tsxにPWAメタタグ追加、Service Worker登録、アイコン配置
  - Purpose: PWAインストールプロンプトを表示し、アイコンを正しく設定する
  - _Leverage: app/layout.tsx_
  - _Requirements: REQ-7_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: フロントエンドエンジニア | Task: app/layout.tsxに<link rel="manifest">, <meta name="theme-color">, <link rel="apple-touch-icon">追加。Service Worker登録スクリプト追加。public/icons/にアイコン配置 | Restrictions: 既存metadata設定維持 | _Leverage: app/layout.tsx | _Requirements: REQ-7 | Success: スマートフォンでPWAインストールプロンプトが表示されること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

## Phase 7: デプロイ・クリーンアップ

- [x] 21. .dev.varsテンプレート作成 + .gitignore更新
  - Files: `.dev.vars.example`（新規）, `.gitignore`
  - ローカル開発用環境変数テンプレートを作成
  - Purpose: ローカル開発環境の環境変数設定を簡単にする
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: DevOpsエンジニア | Task: .dev.vars.example作成（GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, ENCRYPTION_KEY, NEXTAUTH_URL）。.gitignoreに.dev.vars追加 | Restrictions: .dev.varsは絶対にコミットしない | _Leverage: なし | _Requirements: REQ-1 | Success: .dev.vars.exampleが存在し、コピーして使用できること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 22. ビルドスクリプト更新
  - File: `package.json`
  - scriptsセクションをCloudflare対応に更新
  - Purpose: Cloudflare環境でのビルド・デプロイを可能にする
  - _Leverage: 既存のpackage.json_
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: DevOpsエンジニア | Task: package.jsonのscripts更新: dev → wrangler dev, build → next build, deploy → wrangler deploy。既存lint/formatスクリプト維持 | Restrictions: 既存スクリプトを削除しない | _Leverage: 既存のpackage.json | _Requirements: REQ-1 | Success: npm run devでローカルサーバー起動、npm run deployでデプロイできること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._

- [x] 23. 不要ファイル削除
  - Files: `lib/config/paths.ts`（削除）, `lib/infrastructure/db/connection.ts`（削除）, `lib/infrastructure/crypto/encryption.ts`（削除）
  - ファイルシステム依存・Node.jsネイティブモジュール依存の不要ファイルを削除
  - Purpose: Cloudflare Workers環境で動作するコードのみを残す
  - _Requirements: REQ-1, REQ-4, REQ-5_
  - _Prompt: Implement the task for spec cloudflare-hosting, first run spec-workflow-guide to get the workflow guide then implement the task: Role: バックエンドエンジニア | Task: lib/config/paths.ts、lib/infrastructure/db/connection.ts、lib/infrastructure/crypto/encryption.tsを削除。削除前にgrep検索で依存が残っていないことを確認 | Restrictions: 依存が残っている場合は新モジュールに置き換えてから削除 | _Leverage: なし | _Requirements: REQ-1, REQ-4, REQ-5 | Success: ビルドエラーが発生せず、不要ファイルが削除されていること | After implementation, mark this task as [-] in tasks.md, log the implementation with log-implementation tool, then mark as [x] when complete._
