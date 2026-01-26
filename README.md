<div align="center">

# SoloDay

**一人社長のための、30秒で今日を把握するAIアシスタント**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Mastra](https://img.shields.io/badge/Mastra-1.0-6366F1?style=flat-square)](https://mastra.ai/)
[![Panda CSS](https://img.shields.io/badge/Panda_CSS-1.8-FDE047?style=flat-square)](https://panda-css.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br />

複数のカレンダーを統合し、AIが「今日やるべきこと」を教えてくれる。<br />
忙しい一人社長・フリーランスのためのローカル実行ツール。

</div>

---

## Features

### 実装済み

- **マルチLLMプロバイダ対応** - Claude / OpenAI / Ollama から選択可能
- **セキュアな認証情報管理** - APIキーはmacOS Keychainに安全に保存
- **オンボーディングフロー** - 直感的なセットアップウィザード
- **APIキー検証** - 設定前に接続確認を実施

### 開発中

- **カレンダー統合** - Google Calendar（複数アカウント）+ iCal URL対応
- **今日/今週ビュー** - 予定を一目で把握
- **AI質問応答** - 「今日の優先タスクは？」などの質問に回答
- **ミーアキャットキャラクター** - 親しみやすいUIコンパニオン

---

## Tech Stack

| カテゴリ | 技術 |
|---------|------|
| **フレームワーク** | Next.js 16.1 (App Router, Turbopack) |
| **言語** | TypeScript 5.9 (strict mode) |
| **AI基盤** | Mastra 1.0 (Vercel AI SDK上に構築) |
| **UI** | Panda CSS 1.8 + Park UI 0.43 |
| **Lint/Format** | Biome 2.3 |
| **データベース** | SQLite (better-sqlite3) |
| **認証情報** | macOS Keychain (keytar) |
| **バリデーション** | Zod 4.3 |

---

## Getting Started

### 必要条件

- Node.js 20+
- macOS（Keychain連携のため）

### インストール

```bash
git clone https://github.com/ignission/soloday.git
cd soloday
npm install
```

### 起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセスし、オンボーディングを開始してください。

---

## Development

### コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Lint & Formatチェック
npm run lint

# Lint & Format修正適用
npm run lint:fix
```

### 設定ファイル

| ファイル | 用途 |
|---------|------|
| `panda.config.ts` | Panda CSS設定 |
| `biome.json` | Biome (Lint/Format) 設定 |
| `tsconfig.json` | TypeScript設定 |

---

## Architecture

```
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
│  │  SQLite     │    │  Keychain   │    │
│  │  (設定,     │    │  (API Key,  │    │
│  │   キャッシュ) │    │   Token)    │    │
│  └─────────────┘    └─────────────┘    │
└─────────────────────────────────────────┘
        │
        ▼
    localhost:3000
```

### レイヤー構成（DDD）

```
lib/
├── domain/          # ドメイン層
│   └── shared/      # Result<T,E>, Option<T>型など
├── application/     # アプリケーション層
│   └── setup/       # セットアップユースケース
└── infrastructure/  # インフラストラクチャ層
    ├── db/          # SQLite接続
    └── keychain/    # macOS Keychain操作
```

### 設計原則

- **関数型プログラミング** - Result型/Option型による型安全なエラーハンドリング
- **ドメイン駆動設計** - レイヤー分離による関心の分離
- **UXファースト** - 機能より体験を優先

---

## Data Storage

```
~/.soloday/
├── config.json        # 非機密設定のみ
├── db.sqlite          # カレンダーキャッシュ、セッション
└── (credentials)      # → OS Keychain に保存
```

**セキュリティポリシー**
- APIキー・トークンは平文ファイルに保存しない
- OAuth は PKCE 方式（サーバー不要）
- localhost のみバインド
- Google Calendar は read-only スコープのみ

---

## Roadmap

- [x] プロジェクト基盤構築
- [x] LLMプロバイダ選択・設定UI
- [x] APIキー検証機能
- [x] macOS Keychain連携
- [ ] Google Calendar OAuth連携
- [ ] iCal URL取り込み
- [ ] 今日/今週の予定表示
- [ ] AI質問応答機能
- [ ] ミーアキャットキャラクター実装
- [ ] npx配布対応

---

## Scope

### やること

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

---

## License

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。
