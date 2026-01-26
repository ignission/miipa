# Requirements Document - calendar-integration

## Introduction

SoloDayのコア機能であるカレンダー統合を実装する。Google Calendar（複数アカウント対応）とiCal URLからの予定取得を可能にし、「今日/今週の自分を30秒で把握」というプロダクトビジョンの実現基盤を構築する。

## Alignment with Product Vision

本機能は以下の製品ビジョンを直接支援する:

- **30秒で把握**: 複数カレンダーを統合し、今日/今週の予定を一箇所で確認可能に
- **ローカル実行**: OAuth PKCE方式でサーバーレス認証、データはローカルにキャッシュ
- **セキュリティ**: OAuth トークンはmacOS Keychainに保存、read-onlyスコープのみ
- **一人社長向け**: 複数のGoogleアカウント（仕事用・個人用など）を統合

## Requirements

### Requirement 1: Google Calendar OAuth認証

**User Story:** 一人社長として、自分のGoogleカレンダーを安全に連携したい。なぜなら、OAuth認証により安全にアクセスでき、パスワードを共有する必要がないからである。

#### Acceptance Criteria

1. WHEN ユーザーが「Googleカレンダーを追加」を選択 THEN システム SHALL OAuth認証フローを開始する
2. WHEN OAuth認証フロー開始 THEN システム SHALL PKCE方式（サーバーレス）で認証を行う
3. WHEN 認証成功 THEN システム SHALL アクセストークンとリフレッシュトークンをKeychainに保存する
4. IF アクセストークンが期限切れ THEN システム SHALL リフレッシュトークンで自動更新する
5. WHEN トークン更新失敗 THEN システム SHALL ユーザーに再認証を促す
6. WHEN OAuth認証 THEN システム SHALL `calendar.readonly` スコープのみを要求する（read-only）

### Requirement 2: 複数Googleアカウント対応

**User Story:** 一人社長として、仕事用と個人用の複数のGoogleアカウントを登録したい。なぜなら、すべての予定を一箇所で確認できるからである。

#### Acceptance Criteria

1. WHEN ユーザーが新しいGoogleアカウントを追加 THEN システム SHALL 既存アカウントと区別して保存する
2. WHEN 複数アカウントが登録済み THEN システム SHALL 各アカウントのカレンダー一覧を取得する
3. WHEN カレンダー一覧取得 THEN システム SHALL 各カレンダーの有効/無効を設定可能にする
4. IF アカウントを削除 THEN システム SHALL 該当アカウントのトークンをKeychainから削除する
5. WHEN アカウント一覧表示 THEN システム SHALL Googleアカウントのメールアドレスを表示する

### Requirement 3: iCal URL取り込み

**User Story:** 一人社長として、iCal形式のURLからカレンダーを取り込みたい。なぜなら、Google以外のカレンダーサービス（祝日、共有カレンダー等）も統合できるからである。

#### Acceptance Criteria

1. WHEN ユーザーがiCal URLを入力 THEN システム SHALL URLの有効性を検証する
2. WHEN 有効なiCal URL THEN システム SHALL iCalデータを取得・パースする
3. WHEN iCalパース成功 THEN システム SHALL カレンダー名を抽出または入力を求める
4. IF iCal URLがアクセス不可 THEN システム SHALL エラーメッセージを表示する
5. WHEN iCalカレンダー追加 THEN システム SHALL URL、カレンダー名、最終同期日時を保存する

### Requirement 4: カレンダーイベント取得

**User Story:** 一人社長として、登録したカレンダーから今日と今週の予定を取得したい。なぜなら、素早く予定を確認できるからである。

#### Acceptance Criteria

1. WHEN 今日の予定を取得 THEN システム SHALL 本日0:00〜23:59のイベントを返す
2. WHEN 今週の予定を取得 THEN システム SHALL 今週月曜〜日曜のイベントを返す
3. WHEN イベント取得 THEN システム SHALL タイトル、開始時刻、終了時刻、場所、説明を含める
4. WHEN 複数カレンダーから取得 THEN システム SHALL 開始時刻でソートして統合する
5. IF 終日イベント THEN システム SHALL 時刻なしで表示する
6. WHEN イベント取得 THEN システム SHALL カレンダー名（ソース）も含める

### Requirement 5: イベントキャッシュ

**User Story:** 一人社長として、オフラインでも直近の予定を確認したい。なぜなら、ネットワーク接続がない場所でも予定を把握できるからである。

#### Acceptance Criteria

1. WHEN イベント取得成功 THEN システム SHALL SQLiteにキャッシュする
2. WHEN キャッシュ保存 THEN システム SHALL 今日から2週間分のイベントを保持する
3. IF ネットワーク接続なし THEN システム SHALL キャッシュからイベントを返す
4. WHEN アプリ起動 THEN システム SHALL バックグラウンドでキャッシュを更新する
5. IF キャッシュが古い（1時間以上） THEN システム SHALL 「最終更新: XX分前」を表示する

### Requirement 6: カレンダー同期

**User Story:** 一人社長として、カレンダーの変更を定期的に反映させたい。なぜなら、最新の予定を常に確認できるからである。

#### Acceptance Criteria

1. WHEN アプリ起動 THEN システム SHALL 全カレンダーの同期を開始する
2. WHEN 手動同期ボタン押下 THEN システム SHALL 即座に全カレンダーを同期する
3. WHEN 同期中 THEN システム SHALL 同期インジケータを表示する
4. IF 同期エラー THEN システム SHALL エラーカレンダーを特定して表示する
5. WHEN 同期完了 THEN システム SHALL 最終同期日時を更新する

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: カレンダープロバイダ（Google, iCal）は個別モジュールとして実装
- **Modular Design**: OAuth認証、イベント取得、キャッシュは独立したサービスとして設計
- **Dependency Management**: ドメイン層はインフラ層に依存しない（リポジトリパターン）
- **Clear Interfaces**: CalendarProviderインターフェースで各プロバイダを抽象化

### DDD（ドメイン駆動設計）

- **エンティティ**: `CalendarEvent`（識別子: eventId + calendarId）
- **値オブジェクト**: `CalendarId`, `EventId`, `TimeRange`, `CalendarSource`
- **集約**: `Calendar`（カレンダー + 関連イベント）
- **リポジトリ**: `CalendarRepository`, `EventRepository`
- **ドメインサービス**: `CalendarSyncService`

### Performance

- カレンダー一覧取得: 1秒以内
- イベント取得（キャッシュあり）: 100ms以内
- イベント取得（API経由）: 3秒以内
- 同期処理: バックグラウンドで実行、UIをブロックしない

### Security

- OAuth トークンはmacOS Keychain (keytar) に保存
- Google Calendar は `calendar.readonly` スコープのみ（読み取り専用）
- iCal URLは設定ファイルに保存（機密情報を含まない前提）
- HTTPS必須（iCal URL）

### Reliability

- ネットワークエラー時はキャッシュにフォールバック
- トークン期限切れ時は自動リフレッシュ
- 個別カレンダーのエラーが全体に影響しない設計
- Result型によるエラーハンドリング

### Usability

- カレンダー追加は3ステップ以内で完了
- 同期状態が視覚的にわかる
- エラー時は具体的な解決方法を提示
- 日本語UIとエラーメッセージ

## Out of Scope

本 calendar-integration 仕様では以下を対象外とする:

- カレンダーイベントの作成・編集・削除（read-only）
- Google Calendar 以外の OAuth プロバイダ（Microsoft, Apple等）
- カレンダーの共有・公開機能
- リマインダー・通知機能
- カレンダーUIの実装（別仕様で対応）
- AIによる予定分析（別仕様で対応）
