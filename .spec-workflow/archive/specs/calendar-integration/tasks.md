# Tasks Document - calendar-integration

## 概要

カレンダー統合機能の実装タスク。

- Requirements: `.spec-workflow/specs/calendar-integration/requirements.md`
- Design: `.spec-workflow/specs/calendar-integration/design.md`

---

## タスク一覧

### Phase 1: ドメイン層

- [ ] 1. カレンダードメイン型定義
  - File: `lib/domain/calendar/types.ts`
  - CalendarId, EventId, CalendarSource, TimeRange等の値オブジェクト定義
  - Purpose: カレンダードメインの型安全性確保
  - _Leverage: `lib/domain/shared/types.ts`（Brand型パターン）_
  - _Requirements: 4_
  - _Prompt: Implement the task for spec calendar-integration, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript/DDD開発者 | Task: `lib/domain/calendar/types.ts`を作成。CalendarId, EventId（Brand型）、CalendarSource（google/ical）、TimeRange（startDate, endDate）を定義。既存のBrand型パターンに従う | Restrictions: ドメイン層は他レイヤーに依存しない | Success: 型定義が完了し、他ファイルからimport可能_

- [ ] 2. CalendarEventエンティティ実装
  - File: `lib/domain/calendar/event.ts`
  - CalendarEventエンティティとファクトリ関数
  - Purpose: イベントデータの表現
  - _Leverage: `lib/domain/calendar/types.ts`, `lib/domain/shared/option.ts`_
  - _Requirements: 4_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript/DDD開発者 | Task: `lib/domain/calendar/event.ts`を作成。CalendarEvent interface（id, calendarId, title, startTime, endTime, isAllDay, location: Option, description: Option, source）とcreateCalendarEvent()ファクトリ関数を実装 | Restrictions: イミュータブル、Option型使用 | Success: CalendarEventが生成・使用可能_

- [ ] 3. リポジトリインターフェース定義
  - File: `lib/domain/calendar/repository.ts`
  - CalendarRepository, EventRepositoryインターフェース
  - Purpose: データアクセスの抽象化
  - _Leverage: `lib/domain/shared/result.ts`_
  - _Requirements: 5_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript/DDD開発者 | Task: `lib/domain/calendar/repository.ts`を作成。CalendarRepository（findAll, save, delete）とEventRepository（findByRange, saveMany, deleteByCalendar, getLastSyncTime, updateLastSyncTime）をResult型で定義 | Restrictions: インターフェースのみ、実装はインフラ層 | Success: リポジトリ契約が明確に定義される_

- [ ] 4. カレンダープロバイダインターフェース
  - File: `lib/domain/calendar/provider.ts`
  - CalendarProviderインターフェースと共通エラー型
  - Purpose: Google/iCalプロバイダの抽象化
  - _Leverage: `lib/domain/shared/result.ts`, `lib/domain/calendar/types.ts`_
  - _Requirements: 1, 3_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript/DDD開発者 | Task: `lib/domain/calendar/provider.ts`を作成。CalendarProvider interface（type, getCalendars, getEvents）とCalendarError型（AUTH_REQUIRED, AUTH_EXPIRED, API_ERROR, NETWORK_ERROR, PARSE_ERROR, NOT_FOUND）を定義 | Restrictions: インターフェースのみ | Success: プロバイダ抽象が完成_

- [ ] 5. ドメイン層index.tsエクスポート
  - File: `lib/domain/calendar/index.ts`
  - カレンダードメインの公開API
  - Purpose: モジュール境界の明確化
  - _Leverage: Phase 1の全ファイル_
  - _Requirements: NFR-Modularity_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: `lib/domain/calendar/index.ts`を作成。types, event, repository, providerから必要な型・関数をエクスポート | Success: `import { CalendarEvent, CalendarProvider } from '@/lib/domain/calendar'`が動作_

### Phase 2: インフラ層（データベース）

- [ ] 6. SQLiteスキーマ・マイグレーション
  - File: `lib/infrastructure/db/migrations/001_calendar_events.ts`
  - calendar_events, calendar_sync_stateテーブル作成
  - Purpose: イベントキャッシュ用スキーマ
  - _Leverage: `lib/infrastructure/db/connection.ts`_
  - _Requirements: 5_
  - _Prompt: Implement the task for spec calendar-integration: Role: SQLite/TypeScript開発者 | Task: マイグレーションファイルを作成。calendar_events（id, event_id, calendar_id, title, start_time, end_time, is_all_day, location, description, source_type, source_name, source_account, cached_at）とcalendar_sync_state（calendar_id, last_sync_time, sync_status）テーブル、インデックス作成 | Success: テーブルが作成される_

- [ ] 7. EventRepository実装
  - File: `lib/infrastructure/db/event-repository.ts`
  - SQLiteを使用したEventRepositoryの実装
  - Purpose: イベントキャッシュのCRUD
  - _Leverage: `lib/infrastructure/db/connection.ts`, `lib/domain/calendar/repository.ts`_
  - _Requirements: 5_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript/SQLite開発者 | Task: EventRepositoryインターフェースを実装。findByRange（TimeRangeでクエリ）、saveMany（バルクInsert/Replace）、deleteByCalendar、getLastSyncTime、updateLastSyncTimeをResult型で実装 | Restrictions: better-sqlite3使用、同期API | Success: イベントのキャッシュ読み書きが動作_

### Phase 3: インフラ層（OAuth・プロバイダ）

- [ ] 8. OAuthサービス実装
  - File: `lib/infrastructure/calendar/oauth-service.ts`
  - Google OAuth 2.0 PKCE フロー
  - Purpose: 認証フロー管理
  - _Leverage: `lib/infrastructure/keychain/`_
  - _Requirements: 1_
  - _Prompt: Implement the task for spec calendar-integration: Role: OAuth/TypeScript開発者 | Task: OAuthServiceを実装。generateAuthUrl()でPKCE code_verifier生成、exchangeCode()でトークン交換、refreshToken()でリフレッシュ。環境変数からGOOGLE_CLIENT_IDを読み込み。Result型使用 | Restrictions: PKCEフロー、googleapis使用 | Success: 認証URLが生成され、コード交換が動作_

- [ ] 9. Keychainトークンストア
  - File: `lib/infrastructure/calendar/token-store.ts`
  - OAuthトークンのKeychain保存・取得
  - Purpose: トークンの安全な永続化
  - _Leverage: `lib/infrastructure/keychain/`_
  - _Requirements: 1_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript/セキュリティ開発者 | Task: TokenStoreを実装。saveTokens(accountEmail, tokens)、getTokens(accountEmail)、deleteTokens(accountEmail)。Keychainキーは`google-oauth-${email}`形式。JSON.stringify/parseでトークンをシリアライズ | Success: トークンがKeychainに保存・取得可能_

- [ ] 10. GoogleCalendarProvider実装
  - File: `lib/infrastructure/calendar/google-provider.ts`
  - Google Calendar API連携
  - Purpose: Googleカレンダーからのデータ取得
  - _Leverage: `lib/domain/calendar/provider.ts`, googleapis_
  - _Requirements: 1, 2, 4_
  - _Prompt: Implement the task for spec calendar-integration: Role: Google API/TypeScript開発者 | Task: GoogleCalendarProviderを実装。getCalendars()でカレンダー一覧取得、getEvents()でイベント取得。トークン期限切れ時は自動リフレッシュ。calendar.readonly スコープのみ | Restrictions: googleapis使用、エラーはResult型 | Success: Googleカレンダーのイベントが取得可能_

- [ ] 11. iCalProvider実装
  - File: `lib/infrastructure/calendar/ical-provider.ts`
  - iCal URLからのイベント取得
  - Purpose: iCalカレンダーのパース・取得
  - _Leverage: `lib/domain/calendar/provider.ts`, ical.js_
  - _Requirements: 3, 4_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: ICalProviderを実装。validateUrl()でURL有効性確認、getEvents()でiCalをfetch→パース→CalendarEvent変換。ical.js使用 | Restrictions: HTTPSのみ、タイムアウト10秒 | Success: iCal URLからイベント取得可能_

- [ ] 12. インフラ層カレンダーindex.ts
  - File: `lib/infrastructure/calendar/index.ts`
  - カレンダーインフラ層のエクスポート
  - Purpose: モジュール境界
  - _Leverage: Phase 3の全ファイル_
  - _Requirements: NFR-Modularity_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: OAuthService, TokenStore, GoogleCalendarProvider, ICalProviderをエクスポート | Success: インフラ層が利用可能_

### Phase 4: アプリケーション層

- [ ] 13. Config拡張（calendars配列）
  - File: `lib/config/types.ts`（修正）
  - CalendarConfig型とcalendars配列の追加
  - Purpose: カレンダー設定の永続化
  - _Leverage: 既存のlib/config/_
  - _Requirements: 2, 3_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: `lib/config/types.ts`にCalendarConfig（id, type, name, enabled, color?, googleAccountEmail?, googleCalendarId?, icalUrl?）を追加。AppConfigにcalendars: CalendarConfig[]を追加。Zodスキーマも更新 | Success: config.jsonにcalendarsが保存可能_

- [ ] 14. AddGoogleCalendarユースケース
  - File: `lib/application/calendar/add-google-calendar.ts`
  - Googleカレンダー追加フロー
  - Purpose: OAuth→カレンダー登録の統合
  - _Leverage: インフラ層のOAuthService, GoogleCalendarProvider_
  - _Requirements: 1, 2_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: startGoogleAuth()で認証URL生成、completeGoogleAuth(code, codeVerifier)でトークン交換→カレンダー一覧取得→設定保存 | Success: Googleカレンダーが追加可能_

- [ ] 15. AddICalCalendarユースケース
  - File: `lib/application/calendar/add-ical-calendar.ts`
  - iCalカレンダー追加
  - Purpose: iCal URL登録
  - _Leverage: ICalProvider_
  - _Requirements: 3_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: addICalCalendar(url, name?)を実装。URL検証→カレンダー名抽出（または入力）→設定保存 | Success: iCalカレンダーが追加可能_

- [ ] 16. GetEventsユースケース
  - File: `lib/application/calendar/get-events.ts`
  - イベント取得（キャッシュ優先）
  - Purpose: 今日/今週のイベント統合取得
  - _Leverage: EventRepository, CalendarProviders_
  - _Requirements: 4, 5_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: getEventsForToday()、getEventsForWeek()を実装。キャッシュ確認→古ければAPI取得→ソート→統合 | Success: 今日/今週のイベントが取得可能_

- [ ] 17. SyncCalendarsユースケース
  - File: `lib/application/calendar/sync-calendars.ts`
  - カレンダー同期
  - Purpose: 全カレンダーの更新
  - _Leverage: EventRepository, CalendarProviders_
  - _Requirements: 6_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: syncAllCalendars()を実装。有効カレンダー取得→並列イベント取得→キャッシュ更新→同期時刻更新。エラーカレンダーの特定 | Success: 同期が実行可能_

- [ ] 18. アプリケーション層index.ts
  - File: `lib/application/calendar/index.ts`
  - カレンダーユースケースのエクスポート
  - Purpose: モジュール境界
  - _Leverage: Phase 4のユースケース_
  - _Requirements: NFR-Modularity_
  - _Prompt: Implement the task for spec calendar-integration: Role: TypeScript開発者 | Task: 全ユースケースをエクスポート | Success: アプリケーション層が利用可能_

### Phase 5: API Routes

- [ ] 19. OAuth Callback API
  - File: `app/api/auth/google/callback/route.ts`
  - Google OAuth コールバック処理
  - Purpose: 認証完了処理
  - _Leverage: AddGoogleCalendarユースケース_
  - _Requirements: 1_
  - _Prompt: Implement the task for spec calendar-integration: Role: Next.js開発者 | Task: GET /api/auth/google/callback を実装。code, state取得→completeGoogleAuth呼び出し→成功時リダイレクト | Success: OAuth認証が完了する_

- [ ] 20. Calendars API
  - File: `app/api/calendars/route.ts`, `app/api/calendars/[id]/route.ts`
  - カレンダーCRUD API
  - Purpose: カレンダー管理エンドポイント
  - _Leverage: ユースケース層_
  - _Requirements: 2, 3_
  - _Prompt: Implement the task for spec calendar-integration: Role: Next.js開発者 | Task: GET /api/calendars（一覧）、POST /api/calendars/google（追加開始）、POST /api/calendars/ical（iCal追加）、DELETE /api/calendars/:id（削除） | Success: カレンダー管理APIが動作_

- [ ] 21. Events API
  - File: `app/api/events/route.ts`
  - イベント取得API
  - Purpose: 今日/今週のイベント取得
  - _Leverage: GetEventsユースケース_
  - _Requirements: 4_
  - _Prompt: Implement the task for spec calendar-integration: Role: Next.js開発者 | Task: GET /api/events?range=today|week を実装 | Success: イベントがJSON取得可能_

- [ ] 22. Sync API
  - File: `app/api/calendars/sync/route.ts`
  - 同期API
  - Purpose: 手動同期トリガー
  - _Leverage: SyncCalendarsユースケース_
  - _Requirements: 6_
  - _Prompt: Implement the task for spec calendar-integration: Role: Next.js開発者 | Task: POST /api/calendars/sync を実装 | Success: 同期がトリガー可能_

---

## 依存関係

```
Phase 1 (ドメイン層)
  └─> Phase 2 (DB)
  └─> Phase 3 (OAuth/プロバイダ)
        └─> Phase 4 (アプリケーション層)
              └─> Phase 5 (API Routes)
```

## 実装順序

1. **Phase 1** (タスク1-5): ドメイン層の型・インターフェース
2. **Phase 2** (タスク6-7): SQLiteスキーマ・リポジトリ
3. **Phase 3** (タスク8-12): OAuth・プロバイダ実装
4. **Phase 4** (タスク13-18): ユースケース実装
5. **Phase 5** (タスク19-22): API Routes

---

## 完了基準

- すべてのタスクが完了していること
- `npm run build` が成功すること
- `npx biome check .` でエラーがないこと
- Googleカレンダー追加のOAuthフローが動作すること
- iCal URL追加が動作すること
- 今日/今週のイベント取得が動作すること
- イベントがSQLiteにキャッシュされること
