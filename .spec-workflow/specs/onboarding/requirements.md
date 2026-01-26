# Requirements Document: Onboarding

## Introduction

SoloDayの初回起動時にユーザーがスムーズにセットアップを完了できるオンボーディングフローを提供します。

一人社長が「30秒で設定完了」できるシンプルなUXを最優先とし、LLMプロバイダの選択からAPIキーの安全な保存まで、最小限のステップで完了できることを目指します。

## Alignment with Product Vision

このオンボーディング機能は、SoloDayの「今日/今週の自分を30秒で把握」というビジョンを実現するための入り口となります。

- **シンプルさ**: 情報過多にしない、必要最小限のステップ
- **セキュリティ**: APIキーはmacOS Keychainに安全に保存（平文禁止）
- **マルチプロバイダ対応**: Claude / OpenAI / Ollamaの選択肢を提供
- **ローカル実行**: 外部サーバーへの依存なし

## 前提条件

以下の基盤がproject-setupで実装済み:

- Keychain統合（`getSecret`, `setSecret`, `deleteSecret`, `hasSecret`）
- 設定ファイル管理（`~/.soloday/config.json`）
- 設定ローダー（`loadOrInitializeConfig`, `saveConfig`）
- Result型・Option型によるエラーハンドリング

## Requirements

### Requirement 1: 初回起動検出

**User Story:** 一人社長として、アプリを初めて起動したとき、セットアップ画面に自動的に案内されたい。それにより、何をすべきか迷わずに始められる。

#### Acceptance Criteria

1. WHEN ユーザーがアプリケーションを起動する AND 設定ファイル（`~/.soloday/config.json`）が存在しない THEN システム SHALL セットアップ画面（`/setup`）にリダイレクトする

2. WHEN ユーザーがアプリケーションを起動する AND 設定ファイルは存在する AND LLMプロバイダのAPIキーがKeychainに保存されていない THEN システム SHALL セットアップ画面（`/setup`）にリダイレクトする

3. WHEN ユーザーがアプリケーションを起動する AND 設定ファイルが存在する AND LLMプロバイダのAPIキーがKeychainに保存されている THEN システム SHALL メイン画面（`/`）を表示する

4. IF セットアップ完了済みのユーザーが手動で`/setup`にアクセスする THEN システム SHALL 設定変更モードとしてセットアップ画面を表示する

### Requirement 2: LLMプロバイダ選択

**User Story:** 一人社長として、使いたいLLMプロバイダを3つの選択肢から選びたい。それにより、自分の環境や好みに合ったAIを使える。

#### Acceptance Criteria

1. WHEN セットアップ画面を表示する THEN システム SHALL 以下のプロバイダ選択肢を表示する:
   - Claude（Anthropic） - 推奨として強調表示
   - OpenAI（GPT）
   - Ollama（ローカル）

2. WHEN ユーザーがプロバイダを選択する THEN システム SHALL 選択されたプロバイダを視覚的にハイライトする

3. WHEN ユーザーがClaudeまたはOpenAIを選択する THEN システム SHALL APIキー入力ステップに進む

4. WHEN ユーザーがOllamaを選択する THEN システム SHALL Ollama接続確認ステップに進む（APIキー不要のため）

5. IF プロバイダが選択されていない状態で次へ進もうとする THEN システム SHALL エラーメッセージを表示し、プロバイダ選択を促す

### Requirement 3: APIキー入力と検証

**User Story:** 一人社長として、APIキーを入力して正しいことを確認したい。それにより、設定ミスによるエラーを避けられる。

#### Acceptance Criteria

1. WHEN APIキー入力画面を表示する THEN システム SHALL 以下を表示する:
   - 選択したプロバイダのロゴとプロバイダ名
   - APIキー入力フィールド（パスワードマスク表示）
   - APIキー取得方法へのリンク（各プロバイダの設定ページ）
   - 「検証する」ボタン

2. WHEN ユーザーがAPIキーを入力して「検証する」ボタンをクリックする THEN システム SHALL APIキーの形式を検証する:
   - Claude: `sk-ant-` で始まる文字列
   - OpenAI: `sk-` で始まる文字列

3. WHEN APIキーの形式が正しい THEN システム SHALL プロバイダAPIへテスト接続を実行する

4. WHEN テスト接続が成功する THEN システム SHALL 成功メッセージを表示し、次のステップへ進むボタンを有効化する

5. WHEN テスト接続が失敗する THEN システム SHALL エラーメッセージを表示する（「APIキーが無効です」「接続できません」など具体的なメッセージ）

6. IF APIキーフィールドが空の状態で「検証する」ボタンをクリックする THEN システム SHALL 「APIキーを入力してください」というエラーメッセージを表示する

7. WHEN Ollamaが選択されている THEN システム SHALL ローカルサーバー（デフォルト: `http://localhost:11434`）への接続テストを実行する

### Requirement 4: APIキーの安全な保存

**User Story:** 一人社長として、APIキーを安全に保存したい。それにより、セキュリティリスクを心配せずに使える。

#### Acceptance Criteria

1. WHEN APIキー検証が成功し、ユーザーが「保存して完了」をクリックする THEN システム SHALL APIキーをmacOS Keychainに保存する

2. WHEN APIキーをKeychainに保存する THEN システム SHALL 以下のキー名を使用する:
   - Claude: `anthropic-api-key`
   - OpenAI: `openai-api-key`
   - Ollama: `ollama-api-key`（Ollamaの場合は接続URLを保存）

3. WHEN Keychainへの保存が成功する THEN システム SHALL 設定ファイル（`~/.soloday/config.json`）の`llm.provider`を更新する

4. WHEN Keychainへの保存が失敗する THEN システム SHALL エラーメッセージを表示し、リトライを促す

5. IF 既存のAPIキーがKeychainに存在する THEN システム SHALL ユーザーに上書き確認を行い、承認後に上書き保存する

### Requirement 5: セットアップ完了確認

**User Story:** 一人社長として、セットアップが正常に完了したことを確認したい。それにより、安心してアプリを使い始められる。

#### Acceptance Criteria

1. WHEN すべての設定が正常に保存される THEN システム SHALL 完了画面を表示する

2. WHEN 完了画面を表示する THEN システム SHALL 以下を表示する:
   - 設定完了メッセージ（ミーアキャットキャラクターの祝福イラスト付き）
   - 選択したプロバイダ名の確認
   - 「SoloDayを始める」ボタン

3. WHEN ユーザーが「SoloDayを始める」ボタンをクリックする THEN システム SHALL メイン画面（`/`）に遷移する

4. WHEN 完了画面表示後5秒間操作がない THEN システム SHALL 自動的にメイン画面へ遷移する（オプション機能）

### Requirement 6: 設定変更（再セットアップ）

**User Story:** 一人社長として、後からLLMプロバイダやAPIキーを変更したい。それにより、別のプロバイダを試したり、キーを更新したりできる。

#### Acceptance Criteria

1. WHEN セットアップ完了済みユーザーが`/setup`にアクセスする THEN システム SHALL 現在の設定を表示した状態でセットアップ画面を表示する

2. WHEN 設定変更モードで表示する THEN システム SHALL 以下を表示する:
   - 現在選択中のプロバイダ（ハイライト表示）
   - 「キーを変更する」ボタン
   - 「キャンセル」ボタン（メイン画面に戻る）

3. WHEN ユーザーが別のプロバイダを選択する THEN システム SHALL 新しいプロバイダ用のAPIキー入力画面に進む

4. WHEN 設定変更をキャンセルする THEN システム SHALL 変更を破棄し、メイン画面に戻る

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: セットアップUIコンポーネント、APIキー検証ロジック、Keychain操作は分離する
- **Modular Design**: 各ステップ（プロバイダ選択、キー入力、完了）は独立したコンポーネントとして実装
- **Dependency Management**: 既存の`lib/infrastructure/keychain`と`lib/config`モジュールを活用
- **Clear Interfaces**: 各コンポーネント間のデータフローを明確に定義（props、コールバック）

### Performance

- セットアップ画面の初期表示は1秒以内
- APIキー検証は3秒以内に結果を返す（タイムアウト設定）
- Keychain操作は100ms以内に完了

### Security

- APIキーは画面上でマスク表示（`type="password"`）
- APIキーはメモリ上に一時保持し、保存後は即座にクリア
- APIキーは絶対に設定ファイルやログに出力しない
- すべてのAPIキーはmacOS Keychainにのみ保存
- HTTPS経由でのみプロバイダAPIと通信

### Reliability

- ネットワークエラー時は具体的なエラーメッセージを表示
- 操作途中でブラウザを閉じても、次回起動時に途中から再開可能
- Keychain操作エラー時はリトライ可能なUIを提供

### Usability

- 全体のフローは3ステップ以内（プロバイダ選択 → キー入力 → 完了）
- 各ステップに進捗インジケータを表示
- プロバイダごとのヘルプリンク（APIキー取得方法）を提供
- エラーメッセージは日本語で具体的に（「不明なエラー」は避ける）
- キーボードショートカット対応（Enter で次へ、Escape でキャンセル）

### Accessibility

- キーボードナビゲーション対応
- スクリーンリーダー対応（適切なaria属性）
- 十分なコントラスト比（WCAG AA準拠）

## Out of Scope

- Google Calendar OAuth認証（別仕様で実装）
- カレンダー設定（別仕様で実装）
- モデル選択機能（MVP後に検討）
- Ollamaモデルダウンロード機能
- 多言語対応（日本語のみ）
