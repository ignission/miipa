# Requirements Document: today-week-view

## Introduction

「今日/今週の予定表示」機能は、miipaのコア機能です。一人社長が30秒で今日と今週のスケジュールを把握できるシンプルなUIを提供します。複数のカレンダーから統合されたイベントを時系列で表示し、情報過多を避けた見やすいデザインを実現します。

## Alignment with Product Vision

CLAUDE.mdに記載された製品ビジョン:
- **最重要: UXに一番時間をかける** - 機能より体験を優先
- **30秒で今日を把握できるUI** - 素早く情報を得られる
- **シンプル、情報過多にしない** - 必要な情報のみ表示

この機能はMVPの中核であり、ユーザーが毎日使用するメイン画面となります。

## Requirements

### Requirement 1: 今日の予定表示

**User Story:** 一人社長として、今日の予定を一覧で見たい。素早く今日のスケジュールを把握できるようにするため。

#### Acceptance Criteria

1. WHEN ユーザーがメイン画面（/）にアクセス THEN システム SHALL 今日の予定一覧を表示する
2. WHEN 予定がある THEN システム SHALL 各予定の時間、タイトル、場所（あれば）を表示する
3. WHEN 予定がない THEN システム SHALL 「今日の予定はありません」と表示する
4. WHEN データ読み込み中 THEN システム SHALL ローディング状態を表示する
5. IF 予定が終日イベント THEN システム SHALL 「終日」と表示する

### Requirement 2: 今週の予定表示

**User Story:** 一人社長として、今週の予定を俯瞰したい。週間の計画を立てやすくするため。

#### Acceptance Criteria

1. WHEN ユーザーが「今週」タブを選択 THEN システム SHALL 今週の予定を日別にグループ化して表示する
2. WHEN 各日に予定がある THEN システム SHALL 日付見出しと予定一覧を表示する
3. WHEN 予定がない日 THEN システム SHALL その日を「予定なし」として表示する
4. IF 今日の予定 THEN システム SHALL 「今日」ラベルを強調表示する

### Requirement 3: 表示切替

**User Story:** 一人社長として、今日/今週の表示を簡単に切り替えたい。状況に応じて必要な情報を見られるようにするため。

#### Acceptance Criteria

1. WHEN メイン画面を表示 THEN システム SHALL 「今日」「今週」のタブを表示する
2. WHEN 「今日」タブをクリック THEN システム SHALL 今日の予定のみを表示する
3. WHEN 「今週」タブをクリック THEN システム SHALL 今週の予定を表示する
4. IF ページをリロード THEN システム SHALL 前回選択したタブを維持する（デフォルトは「今日」）

### Requirement 4: カレンダーソース表示

**User Story:** 一人社長として、どのカレンダーからの予定かを識別したい。複数カレンダーを使い分けているため。

#### Acceptance Criteria

1. WHEN 予定を表示 THEN システム SHALL カレンダーの色を予定の左端に表示する
2. IF 複数カレンダーがある THEN システム SHALL カレンダー名をツールチップで表示する

### Requirement 5: リアルタイム性

**User Story:** 一人社長として、最新の予定を見たい。予定が変わった時にすぐ反映されるようにするため。

#### Acceptance Criteria

1. WHEN 画面を開いた時 THEN システム SHALL 最新のイベントを取得して表示する
2. WHEN 「更新」ボタンをクリック THEN システム SHALL カレンダーを再同期して表示を更新する
3. WHEN 同期中 THEN システム SHALL 同期中であることを表示する

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: イベント表示コンポーネントとデータ取得ロジックを分離
- **Modular Design**: 日別グループ化、時間フォーマットなどをユーティリティ関数として分離
- **Dependency Management**: 既存のAPI（/api/events）を活用
- **Clear Interfaces**: コンポーネントPropsの型定義を明確に

### Performance
- 初期表示は1秒以内
- イベント取得はキャッシュを活用
- 不要な再レンダリングを防止

### Security
- APIエンドポイントのみからデータ取得
- XSS対策（ユーザー入力のサニタイズ）

### Reliability
- API エラー時のフォールバック表示
- ネットワーク切断時のエラーメッセージ

### Usability
- タッチデバイスでの操作性
- キーボードナビゲーション対応
- 視認性の高い時間表示（JST）
