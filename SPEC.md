# SoloDay プロジェクト仕様書

## 概要

### プロダクト名
**SoloDay**

### キャラクター
ミーアキャット（立ち上がって周囲を見渡す姿 = 秘書が報告する姿）

### ターゲット
一人社長 / ソロ経営者
- 複数クライアント・プロジェクト並行
- カレンダーがバラバラ（Google複数 + Outlook等）
- 秘書は雇っていない
- 技術がわかる人（初期はエンジニア寄り）

### 解決する課題
**「今日/今週の自分を30秒で把握」**

---

## 機能（MVP）

### やること
- カレンダー統合（Google Calendar 複数アカウント + iCal URL）
- 今日/今週の予定表示（統合ビュー）
- AIへの質問応答（「来週で3時間空いてる？」等）

### やらないこと
- メール連携
- タスク管理（Todoist連携等）
- ドキュメント管理（Obsidian連携等）
- 自動化（メール返信等）
- チーム機能
- Discord/Slack/WhatsApp連携
- プッシュ通知
- 予定の作成・変更（read-only）

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js (App Router) |
| AI | Mastra |
| UI | Panda CSS + Park UI |
| Linter/Formatter | Biome |
| DB | SQLite |
| 認証情報保存 | macOS Keychain (keytar) |
| OAuth | PKCE + localhost |
| 配布 | npx |
| 開発手法 | spec-workflow MCP（仕様駆動） |

---

## アーキテクチャ

```
npx @soloday/cli
        │
        ▼
┌─────────────────────────────────────────┐
│  Next.js + Mastra                       │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │   Agent     │    │   Tools     │    │
│  │ (Mastra)    │    │ - Calendar  │    │
│  └──────┬──────┘    └──────┬──────┘    │
│         │                  │           │
│         └────────┬─────────┘           │
│                  │                     │
│  ┌───────────────▼───────────────┐     │
│  │     LLM Provider              │     │
│  │  (Claude / OpenAI / Local)    │     │
│  └───────────────────────────────┘     │
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │  SQLite     │    │  Keychain   │    │
│  │  (設定,     │    │  (API Key,  │    │
│  │   キャッシュ) │    │   Token)    │    │
│  └─────────────┘    └─────────────┘    │
│                                         │
└─────────────────────────────────────────┘
        │
        ▼
    localhost:3000
```

---

## セキュリティ設計

### 認証情報の保存
- Claude API Key → macOS Keychain（keytar）
- Google OAuth Token → macOS Keychain
- 平文ファイルには保存しない

### Google OAuth
- PKCE + localhost 方式
- サーバー不要でセキュア
- port hijacking 対策済み
- read-only スコープのみ（calendar.readonly）

### ネットワーク
- localhost:3000 のみバインド（外部アクセス不可）

---

## セットアップフロー

```
$ npx @soloday/cli

🦫 SoloDay を起動します...
ブラウザで http://localhost:3000 を開いています...
```

### 初期設定画面

```
┌─────────────────────────────────────────┐
│  SoloDay セットアップ                    │
├─────────────────────────────────────────┤
│                                         │
│  Step 1: LLM 設定                       │
│  ○ Claude (Anthropic)                  │
│  ○ OpenAI                              │
│  ○ ローカル LLM (Ollama)                │
│                                         │
│  API Key: [________________]            │
│  → Keychainに安全に保存されます          │
│                                         │
│  Step 2: カレンダー連携                  │
│  [+ Google アカウントを追加]              │
│  [+ iCal URL を追加]                    │
│                                         │
│                              [完了 →]   │
└─────────────────────────────────────────┘
```

所要時間: 約5分

---

## メイン画面（UI設計）

```
┌─────────────────────────────────────────┐
│  🦫 SoloDay                       [⚙️]  │
├─────────────────────────────────────────┤
│                                         │
│  今日 1/26（月）                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  09:00 - 10:00  A社 定例（Google）       │
│  13:00 - 14:30  B社 設計レビュー（Outlook）│
│  16:00 - 17:00  採用面談（Google2）       │
│                                         │
│  空き時間: 10:00-13:00, 14:30-16:00      │
│  稼働予定: 4.5時間                       │
│                                         │
├─────────────────────────────────────────┤
│  💬 質問                                │
│  ┌─────────────────────────────────┐    │
│  │ 来週で3時間まとまって空いてる？   │    │
│  └─────────────────────────────────┘    │
│                                   [送信] │
└─────────────────────────────────────────┘
```

### UX重要ポイント
- **UXに一番時間をかける**
- 30秒で今日を把握できること
- シンプル、情報過多にしない
- ミーアキャットのキャラクターを活かす

---

## LLM連携設計

### Mastra Agent 定義

```typescript
import { Agent } from '@mastra/core/agent';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider';

const calendarAgent = new Agent({
  name: 'SoloDay Assistant',
  instructions: `
あなたは一人社長のスケジュール管理アシスタントです。
ユーザーのカレンダーデータを元に質問に答えてください。

ルール:
- 簡潔に答える
- 具体的な日時を含める
- 空き時間を聞かれたら、予定のない時間帯を答える
- 営業時間は 9:00-18:00 を想定
- 日本語で回答
  `,
  model: getModel(config), // マルチプロバイダ対応
  tools: [calendarTool],
});
```

### マルチプロバイダ対応

```typescript
function getModel(config: LLMConfig) {
  switch (config.provider) {
    case 'claude':
      return anthropic('claude-sonnet-4-20250514');
    case 'openai':
      return openai('gpt-4o');
    case 'local':
      const ollama = createOllama({ baseURL: config.baseUrl });
      return ollama(config.model);
  }
}
```

---

## データ保存

### ファイル構成

```
~/.soloday/
├── config.json        # 非機密設定のみ
├── db.sqlite          # カレンダーキャッシュ、セッション
└── (credentials)      # → OS Keychain に保存
```

### config.json（機密情報なし）

```json
{
  "llm": {
    "provider": "claude"
  },
  "calendars": [
    { "type": "google", "accountId": "personal", "name": "個人" },
    { "type": "google", "accountId": "work", "name": "仕事" },
    { "type": "ical", "url": "https://outlook.../calendar.ics", "name": "会社" }
  ],
  "settings": {
    "workingHours": { "start": "09:00", "end": "18:00" },
    "theme": "system"
  }
}
```

---

## プロダクトライン

### Phase 1: Self-hosted（ローカル実行）
- 無料 OSS
- npx で起動
- データはローカル保存

### Phase 2: Cloud版（将来）
- $15/月（LLM込み）
- サインアップするだけで使える
- 非エンジニア向け

---

## 開発ロードマップ

### Week 1-2: MVP + UX設計
- [ ] プロジェクトセットアップ（Next.js + Mastra + Panda CSS + Biome）
- [ ] spec-workflow MCP で仕様策定
- [ ] Google Calendar OAuth（PKCE）
- [ ] Keychain 保存（keytar）
- [ ] Mastra Agent 定義
- [ ] Calendar Tool 実装
- [ ] 基本UI（UXに時間をかける）

### Week 3-4: 複数カレンダー + 仕上げ
- [ ] Google 複数アカウント対応
- [ ] iCal URL 対応（Outlook用）
- [ ] 統合ビュー
- [ ] LLM マルチプロバイダ（OpenAI, Ollama）
- [ ] npx 配布準備
- [ ] README / ドキュメント

### Week 5-6: 公開
- [ ] GitHub 公開（OSS）
- [ ] LP作成
- [ ] Twitter/X で発信

---

## 開発方針

1. **UX に一番時間をかける** - 機能より体験
2. **spec-workflow MCP で仕様駆動** - 仕様を先に書いてから実装
3. **Mastra のレールに乗る** - 自前実装の負債を作らない
4. **シンプルに保つ** - 機能追加は慎重に

---

## 参考リンク

- Mastra: https://mastra.ai/docs
- Panda CSS: https://panda-css.com/
- Park UI: https://park-ui.com/
- Biome: https://biomejs.dev/
- spec-workflow MCP: https://github.com/Pimzino/spec-workflow-mcp
- keytar: https://github.com/atom/node-keytar
- Google Calendar API: https://developers.google.com/calendar
- PKCE: https://oauth.net/2/pkce/
