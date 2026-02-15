# Requirements Document - calendar-management-ui

## Introduction

カレンダー管理UIを実装する。ユーザーがGoogleカレンダーやiCal URLを追加・削除・有効/無効切替できる設定画面を提供し、calendar-integration APIと連携する。

## Alignment with Product Vision

本機能は以下の製品ビジョンを支援する:

- **30秒で把握**: カレンダー設定を素早く完了し、すぐに予定確認を開始できる
- **一人社長向け**: 複数のGoogleアカウント・iCalを一箇所で管理
- **UXファースト**: 直感的な操作でカレンダー追加・管理が可能

## Requirements

### Requirement 1: カレンダー一覧表示

**User Story:** 一人社長として、登録済みのカレンダーを一覧で確認したい。なぜなら、どのカレンダーが連携されているか把握できるからである。

#### Acceptance Criteria

1. WHEN カレンダー設定画面を開く THEN システム SHALL 登録済みカレンダーの一覧を表示する
2. WHEN カレンダー一覧表示 THEN システム SHALL 各カレンダーのタイプ（Google/iCal）をアイコンで表示する
3. WHEN カレンダー一覧表示 THEN システム SHALL 各カレンダーの名前と有効/無効状態を表示する
4. WHEN Googleカレンダー表示 THEN システム SHALL アカウントのメールアドレスも表示する
5. IF カレンダーが未登録 THEN システム SHALL 「カレンダーを追加してください」のメッセージを表示する

### Requirement 2: Googleカレンダー追加

**User Story:** 一人社長として、GoogleカレンダーをOAuth認証で追加したい。なぜなら、安全にカレンダーを連携できるからである。

#### Acceptance Criteria

1. WHEN 「Googleカレンダーを追加」ボタン押下 THEN システム SHALL Google OAuth認証を開始する
2. WHEN OAuth認証開始 THEN システム SHALL 新しいウィンドウ/タブで認証画面を表示する
3. WHEN OAuth認証成功 THEN システム SHALL 追加されたカレンダーを一覧に表示する
4. WHEN OAuth認証成功 THEN システム SHALL 成功メッセージを表示する
5. IF OAuth認証失敗/キャンセル THEN システム SHALL エラーメッセージを表示する

### Requirement 3: iCalカレンダー追加

**User Story:** 一人社長として、iCal URLを入力してカレンダーを追加したい。なぜなら、Google以外のカレンダーも統合できるからである。

#### Acceptance Criteria

1. WHEN 「iCalカレンダーを追加」ボタン押下 THEN システム SHALL URL入力フォームを表示する
2. WHEN URL入力フォーム表示 THEN システム SHALL URLとカレンダー名（任意）の入力欄を提供する
3. WHEN 有効なiCal URLを送信 THEN システム SHALL カレンダーを追加して一覧に表示する
4. IF 無効なURLを送信 THEN システム SHALL エラーメッセージを表示する
5. IF カレンダー名未入力 THEN システム SHALL iCalから取得した名前を使用する

### Requirement 4: カレンダー有効/無効切替

**User Story:** 一人社長として、特定のカレンダーを一時的に無効にしたい。なぜなら、削除せずに表示を制御できるからである。

#### Acceptance Criteria

1. WHEN カレンダーの有効/無効トグル押下 THEN システム SHALL 状態を切り替える
2. WHEN 有効→無効に切替 THEN システム SHALL カレンダーをグレーアウト表示する
3. WHEN 無効→有効に切替 THEN システム SHALL カレンダーを通常表示に戻す
4. WHEN 状態切替 THEN システム SHALL 設定を即座に保存する

### Requirement 5: カレンダー削除

**User Story:** 一人社長として、不要なカレンダーを削除したい。なぜなら、連携を解除できるからである。

#### Acceptance Criteria

1. WHEN カレンダーの削除ボタン押下 THEN システム SHALL 確認ダイアログを表示する
2. WHEN 削除確認 THEN システム SHALL カレンダーを削除する
3. WHEN Googleカレンダー削除 THEN システム SHALL OAuth トークンも削除する
4. WHEN 削除完了 THEN システム SHALL 一覧から該当カレンダーを除去する
5. WHEN 削除完了 THEN システム SHALL 成功メッセージを表示する

### Requirement 6: 同期状態表示

**User Story:** 一人社長として、カレンダーの同期状態を確認したい。なぜなら、最新の予定が取得されているか把握できるからである。

#### Acceptance Criteria

1. WHEN カレンダー一覧表示 THEN システム SHALL 各カレンダーの最終同期日時を表示する
2. WHEN 同期エラーがある THEN システム SHALL エラー状態をアイコンで表示する
3. WHEN 「同期」ボタン押下 THEN システム SHALL 全カレンダーを同期する
4. WHEN 同期中 THEN システム SHALL ローディングインジケータを表示する
5. WHEN 同期完了 THEN システム SHALL 最終同期日時を更新する

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: 各コンポーネントは単一の責務を持つ
- **Modular Design**: カレンダーリスト、追加フォーム、削除ダイアログは独立コンポーネント
- **Dependency Management**: Park UI コンポーネントを活用
- **Clear Interfaces**: API呼び出しはカスタムフックで抽象化

### Performance

- カレンダー一覧取得: 500ms以内
- トグル切替の反映: 200ms以内
- 同期開始: 即座にローディング表示

### Security

- OAuth認証はPKCE方式（既存実装を使用）
- iCal URLはHTTPSのみ許可

### Reliability

- API エラー時は適切なエラーメッセージを表示
- ネットワークエラー時はリトライオプションを提供

### Usability

- カレンダー追加は3ステップ以内で完了
- 日本語UIとエラーメッセージ
- レスポンシブデザイン（モバイル対応）
- キーボード操作対応

## Out of Scope

- カレンダーの色設定（将来対応）
- カレンダーのリネーム機能
- ドラッグ&ドロップでの並び替え
- カレンダーのグループ化
