# Requirements Document: cloud-deployment (Self-Host)

## Introduction

miipaをセルフホストでスマートフォンからアクセス可能にする機能を提供します。
自宅のマシンでmiipaを動かし、外部からセキュアにアクセスできるようにします。

## Alignment with Product Vision

miipaは「今日/今週の自分を30秒で把握」するツールです。スマートフォンからアクセスできることで、外出先でも素早く予定を確認できるようになります。セルフホストにより、データを手元に保持しながらモバイルアクセスを実現します。

## 技術選定: Tailscale

セルフホストのネットワーク公開にはTailscaleを採用します。

**選定理由:**
- セットアップが最も簡単（アプリをインストールするだけ）
- ドメイン不要（MagicDNSで自動的にHTTPS対応）
- 全デバイスにTailscaleアプリを入れるだけで接続完了
- 無料（個人利用、100デバイスまで）

**比較検討した代替案:**
- Cloudflare Access: ブラウザのみでアクセス可能だが、ドメイン取得とTunnel設定が必要でセットアップが複雑

## Requirements

### Requirement 1: Tailscale経由のアクセス

**User Story:** 一人社長として、Tailscale経由でmiipaにアクセスしたい。VPN内で安全にアクセスするため。

#### Acceptance Criteria

1. WHEN Tailscaleネットワーク内からアクセスする THEN システム SHALL 正常にページを表示する
2. WHEN `npm run dev`を実行する THEN システム SHALL Tailscale IPでもリッスンする
3. IF Tailscale外からアクセスする THEN システム SHALL 接続を拒否する

### Requirement 2: HTTPS対応

**User Story:** 一人社長として、HTTPS経由でアクセスしたい。通信を暗号化してセキュリティを確保するため。

#### Acceptance Criteria

1. WHEN Tailscale MagicDNSを使用する THEN システム SHALL 自動的にHTTPS証明書を取得する
2. WHEN HTTPでアクセスする THEN システム SHALL HTTPSにリダイレクトする
3. IF 証明書取得に失敗する THEN システム SHALL HTTPでのアクセスを許可し警告を表示する

### Requirement 3: 起動の簡略化

**User Story:** 一人社長として、ワンコマンドでサーバーを起動したい。毎回の設定を省略するため。

#### Acceptance Criteria

1. WHEN `npm run serve`を実行する THEN システム SHALL 本番モードでサーバーを起動する
2. WHEN サーバーが起動する THEN システム SHALL アクセスURLをターミナルに表示する
3. IF 必要な環境変数が未設定 THEN システム SHALL 不足している変数を明示する

### Requirement 4: PWA対応

**User Story:** 一人社長として、スマホのホーム画面にアプリを追加したい。ブラウザを開かずにアクセスするため。

#### Acceptance Criteria

1. WHEN スマートフォンからアクセスする THEN システム SHALL 「ホーム画面に追加」を提案する
2. WHEN PWAとしてインストールする THEN システム SHALL アプリアイコンを表示する
3. WHEN PWAを起動する THEN システム SHALL フルスクリーンで表示する

### Requirement 5: Google OAuth Redirect URI

**User Story:** 一人社長として、外部アクセス時もGoogleカレンダー認証を使いたい。新しいデバイスからもカレンダーを追加するため。

#### Acceptance Criteria

1. WHEN Tailscale経由でアクセスする THEN システム SHALL 正しいRedirect URIを使用する
2. WHEN 環境変数`NEXT_PUBLIC_BASE_URL`が設定されている THEN システム SHALL そのURLをRedirect URIに使用する
3. IF Redirect URIがGoogle OAuth設定と一致しない THEN システム SHALL 明確なエラーメッセージを表示する

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: 起動スクリプトは独立したファイルで管理
- **Modular Design**: 環境固有の設定は環境変数で制御
- **Clear Interfaces**: 必要な環境変数をドキュメント化

### Performance
- ページロード: 2秒以内（LAN内）
- API応答: 200ms以内（LAN内）

### Security
- Tailscaleネットワーク内のみアクセス可能
- 暗号化キーは環境変数で管理
- HTTPS推奨（Tailscale MagicDNS使用時は自動）

### Reliability
- プロセスマネージャ（pm2等）での自動再起動対応
- ヘルスチェックエンドポイント提供

### Usability
- ワンコマンド起動
- 環境変数テンプレート（.env.example）提供
- セットアップ手順のREADME
