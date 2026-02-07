# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**SoloDay** - 一人社長向けカレンダー統合AIアシスタント

ミーアキャットをキャラクターとした、複数カレンダーを統合して「今日/今週の自分を30秒で把握」するCloudflare Workers上で動作するWebアプリケーション。

## 技術スタック

- **フレームワーク**: Next.js (App Router) on Cloudflare Workers
- **AI**: Mastra（Vercel AI SDK上に構築、マルチプロバイダ: Claude/OpenAI/Ollama）
- **UI**: Panda CSS + Park UI
- **Linter/Formatter**: Biome
- **DB**: Cloudflare D1
- **認証**: Auth.js v5
- **暗号化**: Web Crypto API
- **配布**: Cloudflare Workers
- **開発手法**: spec-workflow MCP（仕様駆動）

## コマンド

```bash
# 開発サーバー起動
npm run dev

# Lint & Format（修正適用）
npx biome check --write .

# Lint & Formatチェックのみ
npx biome check .

# ビルド
npm run build
```

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

### Mastra のレールに乗る

会話管理、メモリ、ツールは Mastra 組み込みを使う。自前実装は避ける。

### セキュリティ

- API Key / Token は Web Crypto で暗号化し D1 に保存（平文保存禁止）
- 認証は Auth.js v5（OAuth）
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
Cloudflare Workers
        │
        ▼
┌─────────────────────────────────────────┐
│  Next.js + Mastra                       │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Agent     │    │   Tools     │    │
│  │ (Mastra)    │    │ - Calendar  │    │
│  └──────┬──────┘    └──────┬──────┘    │
│         └────────┬─────────┘           │
│  ┌───────────────▼───────────────┐     │
│  │     LLM Provider              │     │
│  │  (Claude / OpenAI / Ollama)   │     │
│  └───────────────────────────────┘     │
│  ┌─────────────┐    ┌─────────────┐    │
│  │  D1         │    │  Web Crypto │    │
│  │  (設定,     │    │  (API Key,  │    │
│  │   キャッシュ) │    │   Token)    │    │
│  └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────┘
```

## ディレクトリ構成

```
soloday/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # メイン画面
│   ├── setup/page.tsx        # セットアップ画面
│   └── api/
│       ├── calendar/         # カレンダーAPI
│       ├── ask/              # AI質問API
│       └── auth/[...nextauth]/ # Auth.js
├── lib/
│   ├── mastra/
│   │   ├── agent.ts          # Mastra Agent 定義
│   │   └── tools/calendar.ts
│   ├── calendar/
│   │   ├── google.ts         # Google Calendar API
│   │   ├── ical.ts           # iCal パーサー
│   │   └── merge.ts          # 複数カレンダー統合
│   ├── infrastructure/
│   │   ├── db/               # D1接続・リポジトリ
│   │   ├── crypto/           # Web Crypto 暗号化
│   │   └── secret/           # シークレット管理
│   └── config/               # 設定管理
├── migrations/               # D1マイグレーション
├── components/
├── panda.config.ts
└── biome.json
```

## データ保存

Cloudflare D1 に全データを保存:

| テーブル | 用途 |
|---------|------|
| `users` | ユーザー情報（Auth.js管理） |
| `accounts` | OAuthアカウント連携 |
| `sessions` | セッション管理 |
| `settings` | アプリケーション設定 |
| `calendar_events` | カレンダーイベントキャッシュ |
| `credentials` | 暗号化された認証情報 |

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

- [Mastra](https://mastra.ai/docs)
- [Panda CSS](https://panda-css.com/)
- [Park UI](https://park-ui.com/)
- [Biome](https://biomejs.dev/)
- [spec-workflow MCP](https://github.com/Pimzino/spec-workflow-mcp)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Auth.js](https://authjs.dev/)
