# miipa - Claude Code 引き継ぎガイド

## このドキュメントについて

このドキュメントは Claude Code での開発を開始するためのガイドです。
詳細な仕様は `MIIPA_SPEC.md` を参照してください。

---

## 最初にやること

### 0. リポジトリ作成

```bash
# ghq でリポジトリ作成
ghq create miipa
cd $(ghq root)/github.com/<your-username>/miipa

# CLAUDE.md を配置
cp /path/to/CLAUDE.md .
```

### 1. spec-workflow MCP をセットアップ

```bash
# Claude Code に MCP を追加
claude mcp add spec-workflow npx -y @pimzino/spec-workflow-mcp@latest $(pwd)
```

### 2. 仕様駆動で開発を開始

```
「spec-workflow で miipa の Requirements を作成して」

流れ:
1. Requirements（要件定義）
2. Design（設計）
3. Tasks（タスク分解）
4. Implementation（実装）
```

---

## プロジェクト初期化

### 必要なコマンド

```bash
# プロジェクト作成
npx create-next-app@latest miipa --typescript --app --tailwind=false

# Panda CSS + Park UI
cd miipa
npm install -D @pandacss/dev
npx panda init
npm install @park-ui/panda-preset

# Mastra
npm install @mastra/core

# Biome
npm install -D @biomejs/biome
npx biome init

# その他
npm install keytar better-sqlite3
npm install -D @types/better-sqlite3
```

---

## 重要なポイント

### UXに一番時間をかける

- 機能より体験を優先
- 30秒で今日を把握できるUI
- シンプル、情報過多にしない
- ミーアキャットのキャラクターを活かす

### セキュリティ

- API Key は keytar で macOS Keychain に保存
- OAuth は PKCE 方式
- localhost のみバインド
- read-only スコープのみ

### Mastra のレールに乗る

- 会話管理、メモリ、ツールは Mastra 組み込みを使う
- 自前実装は避ける
- 将来の拡張（Phase 3）もスムーズに

---

## ディレクトリ構成（案）

```
miipa/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # メイン画面
│   ├── setup/
│   │   └── page.tsx          # セットアップ画面
│   └── api/
│       ├── calendar/
│       │   └── route.ts      # カレンダーAPI
│       ├── ask/
│       │   └── route.ts      # AI質問API
│       └── auth/
│           └── callback/
│               └── route.ts  # OAuth callback
├── lib/
│   ├── mastra/
│   │   ├── agent.ts          # Mastra Agent 定義
│   │   └── tools/
│   │       └── calendar.ts   # Calendar Tool
│   ├── calendar/
│   │   ├── google.ts         # Google Calendar API
│   │   ├── ical.ts           # iCal パーサー
│   │   └── merge.ts          # 複数カレンダー統合
│   ├── keychain/
│   │   └── index.ts          # Keychain 操作
│   ├── db/
│   │   └── index.ts          # SQLite
│   └── config/
│       └── index.ts          # 設定管理
├── components/
│   ├── calendar-view.tsx
│   ├── chat-input.tsx
│   └── setup-wizard.tsx
├── panda.config.ts
├── biome.json
└── package.json
```

---

## 開発の流れ

### Phase 1: 基盤（Week 1）

1. プロジェクトセットアップ
2. Panda CSS + Park UI 設定
3. Biome 設定
4. 基本レイアウト

### Phase 2: コア機能（Week 1-2）

1. Keychain 保存
2. Google OAuth（PKCE）
3. Google Calendar API 連携
4. Mastra Agent 定義
5. 質問応答

### Phase 3: 統合 + UX（Week 3-4）

1. 複数 Google アカウント
2. iCal URL 対応
3. 統合ビュー
4. UX 磨き込み

### Phase 4: 公開準備（Week 5-6）

1. npx 配布
2. ドキュメント
3. LP

---

## 質問があれば

仕様の詳細は `MIIPA_SPEC.md` を参照。
不明点があれば聞いてください。
