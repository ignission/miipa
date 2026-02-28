# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**miipa** - 一人社長向けカレンダー統合AIアシスタント

ミーアキャットをキャラクターとした、複数カレンダーを統合して「今日/今週の自分を30秒で把握」するアプリケーション。
Hono（Cloudflare Workers）+ Expo（iOS/Android/Web）のモノレポ構成。

## 技術スタック

- **API**: Hono on Cloudflare Workers
- **フロントエンド**: Expo (React Native) + Expo Router（iOS/Android/Web）
- **AI**: カスタムLLMプロバイダー層（Anthropic Claude / OpenAI / Google Gemini / Ollama）
- **UI**: React Native + NativeWind（Tailwind CSS for RN）
- **状態管理**: Zustand + React Query 5
- **Linter/Formatter**: Biome
- **DB**: Cloudflare D1
- **認証**: カスタムJWT（Web Crypto HMAC-SHA256）+ OAuth PKCE
- **暗号化**: Web Crypto API（AES-256-GCM）
- **バリデーション**: Zod
- **ビルド**: Turborepo（pnpmワークスペース）
- **配布**: Cloudflare Workers（API）/ EAS Build（iOS）/ Cloudflare Pages（Web）

## コマンド

```bash
# 全体開発サーバー起動（turbo経由）
pnpm dev

# API のみ起動
pnpm dev:api

# Web のみ起動
pnpm dev:web

# モバイルのみ起動
pnpm dev:mobile

# Lint & Format（修正適用）
pnpm lint:fix

# Lint & Formatチェックのみ
pnpm lint          # または npx biome check .

# ビルド（全パッケージ）
pnpm build

# デプロイ（API + Web）
pnpm deploy

# API のみデプロイ
pnpm deploy:api

# Web のみデプロイ
pnpm deploy:web
```

## 検証ルール

- `node_modules` が存在しない場合は `pnpm install` を先に実行すること
- `npx biome check .` と `pnpm build` が両方通るまで検証完了としないこと
- ビルド失敗を「環境の問題」として片付けない
- PRにpush後は必ず `gh run watch` でCIを監視し、グリーンになるまで確認すること。失敗した場合は即座にログを確認して修正する

## 既知の問題

- **Cloudflare Pages デプロイ時の日本語コミットメッセージ**: `wrangler pages deploy` がgitのコミットメッセージをCloudflare APIに送信する際、日本語（非ASCII）文字が `Invalid commit message, it must be a valid UTF-8 string. [code: 8000111]` エラーを引き起こすことがある。**コミットメッセージは英語で記述すること**。

## Mobileビルドの教訓

### expo doctor の警告は全て修正する

`npx expo doctor` の警告は「単なる警告」ではなく、ビルドクラッシュの直接原因になる。特に:

- **Reactバージョン不整合**: `react` と `react-native-renderer` のバージョンが一致しないと、Debugビルドでは動くがReleaseビルドで即クラッシュする
- **New Architecture未対応モジュール**: TurboModule初期化時にNSException→SIGABRT

### クラッシュ調査はシミュレータReleaseビルドで

```bash
# Release構成でビルド（Debugでは再現しないクラッシュがある）
npx expo run:ios --configuration Release

# 手動インストール＆ログ取得
xcrun simctl install <device-id> <.app path>
xcrun simctl spawn <device-id> log stream \
  --predicate 'process == "miipa"' --level debug
xcrun simctl launch <device-id> app.miipa
```

### Expo Modules APIでカスタムモジュール作成時

- `requireNativeModule` ではなく `requireOptionalNativeModule` を使う（見つからない場合にthrowしない）
- パッケージ追加後は必ず `npx expo install --fix` でバージョン整合性を確認

## 開発方針

### 最重要: UXに一番時間をかける

- 機能より体験を優先
- 30秒で今日を把握できるUI
- シンプル、情報過多にしない

### UI問題の調査

UIの問題（スタイル、コントラスト、レイアウト等）が報告された場合は、ユーザーに確認を求めず**agent-browser**を使って自分で調査すること。

```bash
# ページを開く
npx agent-browser open http://localhost:3333

# 要素のスナップショットを取得
npx agent-browser snapshot

# 特定要素のスタイルを取得
npx agent-browser get styles @e1

# 要素のHTMLを取得
npx agent-browser eval "document.querySelector('article').outerHTML"

# ブラウザを閉じる
npx agent-browser close
```

### 仕様駆動開発

spec-workflow MCP を使用して Requirements → Design → Tasks → Implementation の順序で進める。

```bash
# spec-workflow MCP のセットアップ
claude mcp add spec-workflow npx -y @pimzino/spec-workflow-mcp@latest $(pwd)
```

### AIプロバイダー層

`packages/api/src/lib/ai/providers/` にカスタムマルチプロバイダーを実装。
Anthropic / OpenAI / Google Gemini / Ollama に対応し、ユーザーが設定で選択可能。
ツール呼び出し（get-calendar-events, find-free-slots）とSSEストリーミングをサポート。

### セキュリティ

- API Key / Token は Web Crypto API（AES-256-GCM）で暗号化し D1 に保存（平文保存禁止）
- 認証は カスタムJWT（Web Crypto HMAC-SHA256）+ OAuth PKCE
- JWTアルゴリズム検証（HS256のみ許可、CVE-2015-9235対策）
- SSRF対策（ssrf-guard.ts でプライベートIP・内部ネットワークをブロック）
- マルチテナント分離（全クエリに user_id フィルタ）
- Google Calendar は read-only スコープのみ

### DDD（ドメイン駆動設計）

- ドメイン層をインフラ層から分離
- 値オブジェクト、エンティティ、集約を適切に定義
- ユビキタス言語を使用（カレンダー、予定、プロバイダ等）
- リポジトリパターンでデータアクセスを抽象化

### 関数型プログラミング

- 純粋関数を優先（副作用を端に追いやる）
- イミュータブルなデータ構造を使用
- 型による安全性の確保（Result型、Option型の活用）
- 関数合成でロジックを構築
- クラスより関数、継承より合成

## アーキテクチャ

```
Expo (iOS/Android/Web)
        │
        ▼ (REST API)
┌─────────────────────────────────────────┐
│  Hono + Cloudflare Workers              │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    │
│  │  AI Layer   │    │   Tools     │    │
│  │ (Anthropic/ │    │ - Calendar  │    │
│  │  OpenAI/    │    │ - Free Slots│    │
│  │  Google)    │    └──────┬──────┘    │
│  └──────┬──────┘           │           │
│         └────────┬─────────┘           │
│  ┌───────────────▼───────────────┐     │
│  │     Domain Layer (DDD)        │     │
│  │  Result/Option, Brand型ID     │     │
│  └───────────────────────────────┘     │
│  ┌─────────────┐    ┌─────────────┐    │
│  │  D1         │    │  Web Crypto │    │
│  │  (設定,     │    │  (AES-256-  │    │
│  │   キャッシュ) │    │   GCM暗号化) │    │
│  └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────┘
```

## ディレクトリ構成

```
miipa/
├── packages/
│   └── api/                    # Hono REST API (Cloudflare Workers)
│       └── src/
│           ├── index.ts            # Honoアプリケーションエントリー
│           ├── routes/             # APIエンドポイント
│           │   ├── auth.ts         # OAuth/JWT認証
│           │   ├── briefing.ts     # ブリーフィングAPI
│           │   ├── calendars.ts    # カレンダー管理
│           │   ├── events.ts       # イベント取得
│           │   ├── chat.ts         # AIチャット（SSE）
│           │   ├── settings.ts     # ユーザー設定
│           │   ├── setup.ts        # セットアップ
│           │   └── account.ts      # アカウント管理
│           ├── middleware/         # ミドルウェア
│           │   ├── auth.ts         # JWT認証（HMAC-SHA256）
│           │   ├── cors.ts         # CORS
│           │   ├── error-handler.ts
│           │   ├── rate-limit.ts   # レートリミット
│           │   └── security-headers.ts
│           └── lib/
│               ├── ai/            # AIプロバイダー
│               │   ├── providers/  # Anthropic/OpenAI/Google/Ollama
│               │   ├── tools/      # AIツール（イベント取得、空き時間検索）
│               │   ├── system-prompt.ts
│               │   └── model-resolver.ts
│               ├── auth/          # OAuth PKCE、JWT定数
│               ├── application/   # ユースケース層
│               │   ├── briefing/  # ブリーフィング生成
│               │   ├── calendar/  # カレンダー管理
│               │   └── setup/     # セットアップ
│               ├── domain/        # ドメイン層（DDD）
│               │   ├── calendar/  # カレンダーエンティティ、リポジトリIF
│               │   └── shared/    # Result型、Option型、共有エラー
│               └── infrastructure/ # インフラ層
│                   ├── calendar/  # Google/iCal実装
│                   ├── db/        # D1リポジトリ実装
│                   ├── crypto/    # Web Crypto暗号化
│                   ├── config/    # D1設定リポジトリ
│                   ├── secret/    # シークレット管理
│                   └── network/   # SSRF対策
├── mobile/                     # Expo (iOS/Android/Web)
│   ├── app/                    # Expo Routerページ
│   │   ├── _layout.tsx         # ルートレイアウト
│   │   ├── index.tsx           # ランディングページ
│   │   ├── sign-in.tsx         # サインイン
│   │   ├── auth-callback.tsx   # OAuthコールバック
│   │   └── (auth)/             # 認証ガード済み
│   │       ├── home.tsx        # ホーム/ブリーフィング
│   │       ├── week.tsx        # 週間ビュー
│   │       ├── month.tsx       # 月間ビュー
│   │       ├── chat.tsx        # チャット
│   │       ├── setup.tsx       # カレンダーセットアップ
│   │       └── settings/       # 設定画面群
│   └── src/
│       ├── components/         # UIコンポーネント
│       ├── api/                # API通信（React Query）
│       ├── auth/               # トークン管理
│       ├── hooks/              # カスタムフック
│       ├── store/              # Zustandストア
│       └── theme/              # テーマ設定
├── shared/                     # 共有型定義（@miipa/shared）
│   └── types/
│       └── api.ts              # APIレスポンス型
├── biome.json
├── turbo.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## APIエンドポイント

```text
GET  /health                     # ヘルスチェック
POST /auth/mobile/token          # モバイルJWT発行
GET  /auth/google/start          # Google OAuth開始
GET  /auth/google/callback       # Google OAuthコールバック
POST /auth/refresh               # JWTリフレッシュ
POST /auth/logout                # ログアウト

[認証必須]
POST /briefing                   # ブリーフィング取得
GET  /calendars                  # カレンダー一覧
POST /calendars/google           # Googleカレンダー追加
POST /calendars/ical             # iCal追加
DELETE /calendars/:id            # カレンダー削除
GET  /events                     # イベント取得
POST /chat                       # AIチャット（SSEストリーミング）
GET  /chat                       # チャット履歴取得
GET  /settings                   # 設定取得
POST /settings                   # 設定更新
POST /setup/validate-key         # APIキーバリデーション
POST /account/logout             # アカウント削除
```

## データ保存

Cloudflare D1 に全データを保存:

| テーブル | 用途 |
|---------|------|
| `users` | ユーザー情報 |
| `accounts` | OAuthアカウント連携 |
| `sessions` | セッション管理 |
| `verification_tokens` | メール確認トークン |
| `user_settings` | ユーザー設定（KV形式） |
| `calendars` | カレンダー設定 |
| `calendar_events` | イベントキャッシュ |
| `calendar_sync_state` | 同期状態管理 |
| `credentials` | 暗号化された認証情報 |
| `chat_histories` | チャット履歴 |
| `refresh_tokens` | リフレッシュトークン |
| `pkce_sessions` | PKCE状態管理 |
| `auth_codes` | 認可コード |

## 機能スコープ

### MVP（やること）
- カレンダー統合（Google複数 + iCal URL）
- 今日/今週の予定表示
- AIへの質問応答

### やらないこと
- メール連携
- タスク管理
- ドキュメント管理
- 予定の作成・変更（read-only）
- チーム機能
- 外部通知（Discord等）

## 参考リンク

- [Hono](https://hono.dev/)
- [Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Biome](https://biomejs.dev/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [React Query](https://tanstack.com/query/latest)
- [spec-workflow MCP](https://github.com/Pimzino/spec-workflow-mcp)
