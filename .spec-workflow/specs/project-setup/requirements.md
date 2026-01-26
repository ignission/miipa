# Requirements Document - project-setup

## Introduction

SoloDayプロジェクトの初期セットアップ要件を定義する。本仕様では、Next.js (App Router) + Mastra + Panda CSS + Biome を用いた開発環境の構築、およびプロジェクト構造の初期化を行う。

SoloDayは一人社長向けのカレンダー統合AIアシスタントであり、ミーアキャットをキャラクターとして「今日/今週の自分を30秒で把握」できるローカル実行ツールを目指す。

## Alignment with Product Vision

本セットアップは以下の製品ビジョンを支援する:

- **UXファースト**: 30秒で今日を把握できるシンプルなUI基盤の構築
- **ローカル実行**: npx配布によるローカル完結型アプリケーション
- **セキュリティ**: macOS Keychain統合による安全な認証情報管理の基盤
- **開発効率**: Biome による高速な lint/format、仕様駆動開発の基盤整備

## Requirements

### Requirement 1: Next.js プロジェクト初期化

**User Story:** 開発者として、Next.js App Router を使用したプロジェクト基盤が欲しい。なぜなら、モダンなReactアプリケーションを効率的に開発できるからである。

#### Acceptance Criteria

1. WHEN `npm run dev` を実行 THEN システム SHALL localhost:3000 で開発サーバーを起動する
2. WHEN `npm run build` を実行 THEN システム SHALL エラーなくプロダクションビルドを完了する
3. IF Next.js 15+ がインストールされている THEN システム SHALL App Router 形式のディレクトリ構成を持つ
4. WHEN プロジェクトを初期化 THEN システム SHALL TypeScript を有効にする

### Requirement 2: Panda CSS + Park UI セットアップ

**User Story:** 開発者として、Panda CSS と Park UI を使用したスタイリング基盤が欲しい。なぜなら、型安全で一貫性のあるUIを効率的に構築できるからである。

#### Acceptance Criteria

1. WHEN `panda.config.ts` が存在 THEN システム SHALL Panda CSS のスタイル生成が有効になる
2. WHEN Park UI のプリセットを設定 THEN システム SHALL Park UI コンポーネントが利用可能になる
3. WHEN コンポーネントでスタイルを記述 THEN システム SHALL 型安全な CSS-in-JS として動作する
4. IF スタイルを変更 THEN システム SHALL 開発サーバーでホットリロードが機能する

### Requirement 3: Biome 設定

**User Story:** 開発者として、Biome による lint と format の統合環境が欲しい。なぜなら、コード品質を維持しながら高速な開発体験を得られるからである。

#### Acceptance Criteria

1. WHEN `npx biome check .` を実行 THEN システム SHALL プロジェクト全体の lint/format チェックを実行する
2. WHEN `npx biome check --write .` を実行 THEN システム SHALL 自動修正を適用する
3. IF biome.json が存在 THEN システム SHALL プロジェクト固有のルール設定を読み込む
4. WHEN lint エラーが存在 THEN システム SHALL エラー箇所と修正方法を明確に表示する

### Requirement 4: Mastra 統合基盤

**User Story:** 開発者として、Mastra AI フレームワークの基盤設定が欲しい。なぜなら、マルチプロバイダ対応のAIエージェントを効率的に実装できるからである。

#### Acceptance Criteria

1. WHEN Mastra パッケージがインストールされている THEN システム SHALL Agent 定義ファイルを `lib/mastra/agent.ts` に配置できる
2. IF LLM プロバイダ設定が存在 THEN システム SHALL Claude/OpenAI/Ollama のいずれかを使用可能にする
3. WHEN Mastra の Tools を定義 THEN システム SHALL `lib/mastra/tools/` ディレクトリで管理できる
4. WHEN 環境変数を設定 THEN システム SHALL API キーを安全に読み込む

### Requirement 5: ディレクトリ構成の初期化

**User Story:** 開発者として、CLAUDE.md で定義されたディレクトリ構成が欲しい。なぜなら、チーム全体で一貫した開発規約に従えるからである。

#### Acceptance Criteria

1. WHEN プロジェクトを初期化 THEN システム SHALL 以下のディレクトリ構成を持つ:
   - `app/` - Next.js App Router ページ
   - `app/api/` - API Routes
   - `lib/domain/` - ドメイン層（エンティティ、値オブジェクト、集約、ドメインサービス）
   - `lib/domain/calendar/` - カレンダードメイン（Calendar集約、Event エンティティ等）
   - `lib/domain/shared/` - 共有ドメイン概念（Result型、Option型、共通値オブジェクト）
   - `lib/application/` - アプリケーションサービス（ユースケース実装）
   - `lib/infrastructure/` - インフラ層（外部サービス連携、永続化）
   - `lib/infrastructure/calendar/` - カレンダープロバイダ実装（Google, iCal）
   - `lib/infrastructure/keychain/` - Keychain 操作
   - `lib/infrastructure/db/` - SQLite 操作（リポジトリ実装）
   - `lib/mastra/` - Mastra Agent 定義
   - `lib/config/` - 設定管理
   - `components/` - 再利用可能なUIコンポーネント
2. IF ディレクトリが存在しない THEN システム SHALL 必要なディレクトリを自動生成する
3. WHEN 各ディレクトリに初期ファイルを配置 THEN システム SHALL TypeScript の型定義を含む

### Requirement 6: データ保存基盤

**User Story:** 開発者として、アプリケーションデータの保存基盤が欲しい。なぜなら、設定やキャッシュを永続化できるからである。

#### Acceptance Criteria

1. WHEN アプリケーションを初回起動 THEN システム SHALL `~/.soloday/` ディレクトリを作成する
2. IF 設定ファイルが必要 THEN システム SHALL `~/.soloday/config.json` に非機密設定を保存する
3. WHEN SQLite データベースが必要 THEN システム SHALL `~/.soloday/db.sqlite` を使用する
4. IF 機密情報を保存 THEN システム SHALL macOS Keychain (keytar) を使用する（平文ファイル禁止）

### Requirement 7: 開発スクリプト設定

**User Story:** 開発者として、一般的な開発タスクのスクリプトが欲しい。なぜなら、効率的にビルド・テスト・デプロイができるからである。

#### Acceptance Criteria

1. WHEN `npm run dev` を実行 THEN システム SHALL 開発サーバーを起動する
2. WHEN `npm run build` を実行 THEN システム SHALL プロダクションビルドを実行する
3. WHEN `npm run lint` を実行 THEN システム SHALL Biome による lint チェックを実行する
4. IF package.json が存在 THEN システム SHALL 全ての必要なスクリプトが定義されている

### Requirement 8: DDD レイヤー構成とユーティリティ型の初期化

**User Story:** 開発者として、DDD と関数型プログラミングの基盤となる型定義とディレクトリ構成が欲しい。なぜなら、ドメインロジックを明確に分離し、型安全なエラーハンドリングができるからである。

#### Acceptance Criteria

1. WHEN プロジェクトを初期化 THEN システム SHALL `lib/domain/shared/result.ts` に Result 型を定義する
   - `Result<T, E>` 型で成功（Ok）/失敗（Err）を表現
   - `ok()`, `err()`, `isOk()`, `isErr()`, `map()`, `flatMap()` 等のユーティリティ関数を提供
2. WHEN プロジェクトを初期化 THEN システム SHALL `lib/domain/shared/option.ts` に Option 型を定義する
   - `Option<T>` 型で値の有無を表現
   - `some()`, `none()`, `isSome()`, `isNone()`, `map()`, `flatMap()` 等のユーティリティ関数を提供
3. WHEN ドメイン層のコードを記述 THEN システム SHALL インフラ層への直接依存を禁止する
   - ドメイン層はリポジトリインターフェースのみを参照
   - 具体的な実装はインフラ層で提供
4. IF 値オブジェクトを定義 THEN システム SHALL イミュータブルな型として実装する
   - readonly プロパティを使用
   - 変更は新しいインスタンスの生成で表現
5. WHEN リポジトリインターフェースを定義 THEN システム SHALL `lib/domain/` 配下に配置する
   - 例: `lib/domain/calendar/repository.ts`
6. WHEN リポジトリ実装を作成 THEN システム SHALL `lib/infrastructure/` 配下に配置する
   - 例: `lib/infrastructure/db/calendar-repository.ts`

## Non-Functional Requirements

### Code Architecture and Modularity

- **Single Responsibility Principle**: 各ファイルは単一の明確な目的を持つ
- **Modular Design**: コンポーネント、ユーティリティ、サービスは分離され再利用可能
- **Dependency Management**: モジュール間の相互依存を最小化
- **Clear Interfaces**: コンポーネントとレイヤー間のクリーンな契約を定義
- **Feature-based Organization**: 機能ごとにファイルをグループ化

### DDD（ドメイン駆動設計）

- **レイヤー分離**: ドメイン層をインフラ層・アプリケーション層から明確に分離する
- **値オブジェクト（Value Object）**: 不変で等価性で比較される概念（例: `CalendarId`, `TimeRange`, `EventTitle`）
- **エンティティ（Entity）**: 識別子を持ち、ライフサイクルを通じて追跡される概念（例: `CalendarEvent`, `CalendarProvider`）
- **集約（Aggregate）**: 関連するエンティティと値オブジェクトをまとめた整合性の境界（例: `Calendar` 集約）
- **ユビキタス言語**: コード内で一貫した用語を使用する
  - `Calendar`: カレンダー（Google, iCal等のソース）
  - `Event`: 予定・イベント
  - `Provider`: カレンダープロバイダ（Google, iCal URL等）
  - `TimeRange`: 時間範囲（今日、今週等）
  - `Summary`: AI による要約
- **リポジトリパターン**: データアクセスを抽象化し、ドメイン層をインフラの詳細から隔離する
- **ドメインサービス**: 単一のエンティティに属さないドメインロジックをカプセル化する

### 関数型プログラミング

- **純粋関数優先**: 副作用を持たない関数を基本とし、副作用はアプリケーションの端（エッジ）に追いやる
- **イミュータブルデータ**: データ構造は不変とし、変更は新しいオブジェクトの生成で表現する
- **型による安全性**:
  - `Result<T, E>` 型: 成功/失敗を明示的に型で表現（例外スローを避ける）
  - `Option<T>` 型: null/undefined の代わりに使用し、値の有無を型で表現
- **関数合成**: 小さな関数を組み合わせて複雑なロジックを構築する（パイプライン処理）
- **クラスより関数**: 状態を持たない処理は関数として実装する
- **継承より合成**: オブジェクト指向の継承ではなく、関数や型の合成を優先する
- **宣言的記述**: 「何をするか」を記述し、「どのようにするか」は抽象化する

### Performance

- 開発サーバーの起動時間: 5秒以内
- ホットリロードの反映時間: 1秒以内
- プロダクションビルド時間: 60秒以内
- Biome lint/format チェック: 10秒以内（プロジェクト全体）

### Security

- API キー、トークンは macOS Keychain (keytar) に保存
- 環境変数ファイル（.env）は .gitignore に含める
- 機密情報を含むファイルの平文保存を禁止
- localhost のみでサーバーをバインド（外部公開禁止）

### Reliability

- TypeScript strict モードを有効化
- Biome による一貫したコードスタイルの強制
- 明確なエラーメッセージの表示
- 開発環境と本番環境の設定分離

### Usability

- 明確で包括的な README.md の提供
- 開発環境セットアップの自動化（可能な限り）
- 一貫したコーディング規約の適用
- 日本語でのコメントとドキュメント記述

### Maintainability

- 各モジュールのテスト可能な設計
- 依存関係の明確な管理（package.json）
- バージョン固定による再現可能なビルド
- ディレクトリ構成の文書化

## Out of Scope

本 project-setup 仕様では以下を対象外とする:

- Google Calendar API 統合の実装
- iCal パーサーの実装
- AI エージェントのロジック実装
- OAuth PKCE フローの実装
- UI コンポーネントの実装
- データベーススキーマの詳細設計

これらは別途の仕様で定義する。
