<div align="center">

# miipa

**一人社長のための、30秒で今日を把握するAIアシスタント**

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Mastra](https://img.shields.io/badge/Mastra-1.0-6366F1?style=flat-square)](https://mastra.ai/)
[![Panda CSS](https://img.shields.io/badge/Panda_CSS-1.8-FDE047?style=flat-square)](https://panda-css.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br />

複数のGoogleカレンダーを統合し、一人社長の一日を30秒で把握。

</div>

---

## こんな悩みありませんか？

- 複数のGoogleカレンダーを毎朝行ったり来たり
- 今日の予定を把握するだけで数分かかる
- 予定が散らばっていて全体像が見えない

---

## miipaでできること

- 📅 **30秒で今日を把握** - 複数カレンダーの予定を一画面に統合。今日ビュー・週間ビューで一目瞭然
- 🛡️ **安心のread-only** - カレンダーの読み取りのみ。予定の変更・削除は一切なし
- ✨ **Googleアカウントで即開始** - ワンクリックサインイン、面倒な登録不要、無料

---

## かんたん3ステップ

1. **Googleアカウントでサインイン** - ワンクリックログイン、面倒な登録は不要
2. **表示したいカレンダーを選択** - 複数のカレンダーを一つにまとめます
3. **ダッシュボードで今日の予定を確認** - 今日ビュー・週間ビューですぐ把握

---

## 今後の予定

- AIによる予定分析（「今日の優先度は？」「空き時間はいつ？」）
- ミーアキャットキャラクターによるナビゲーション

---

## Development

### Tech Stack

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 |
| UI | Panda CSS + Park UI |
| Lint/Format | Biome |
| データベース | Cloudflare D1 |
| 認証 | Auth.js v5 (next-auth) |
| デプロイ | Cloudflare Workers |

### コマンド一覧

```bash
# 開発サーバー起動
npm run dev

# ビルド（ローカル確認用）
npm run build

# Lint & Formatチェック
npm run lint

# Lint & Format修正適用
npm run lint:fix

# Cloudflare Workersへデプロイ
npm run deploy
```

### 必要条件

- Node.js 20+（ローカル開発はこれだけでOK）
- Cloudflare アカウント（本番デプロイ時のみ）

---

## License

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。
