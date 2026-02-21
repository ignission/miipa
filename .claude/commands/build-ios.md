# /build-ios - iOS EAS ビルド

iOS アプリの EAS ビルドを実行します。

## 手順

1. **事前チェック**を実行:
   - `cd mobile && npx expo doctor` で警告がないか確認。警告があれば修正してからビルドする
   - `npx tsc --noEmit` で TypeScript エラーがないか確認
   - `npx biome check .` で lint エラーがないか確認

2. **ビルドプロファイル**をユーザーに選択させる（AskUserQuestion を使用）:
   - `preview`: TestFlight テスト用（通常はこちら）
   - `production`: App Store リリース用

3. **EAS ビルドを実行**:
   ```bash
   cd mobile && eas build --platform ios --profile <選択したプロファイル> --local --non-interactive
   ```
   `--local` でローカルマシン上でビルドする。バックグラウンドで実行し、完了を待つ。

4. **ビルド結果を確認**:
   - ビルド成功時は生成された `.ipa` ファイルのパスをユーザーに共有
   - TestFlight に提出する場合は `/submit-testflight` を案内

## 注意事項

- ビルド前に未コミットの変更がある場合は警告する
- `eas build` は EAS アカウントにログイン済みであることが前提
- production ビルドは `autoIncrement: true` でバージョンが自動インクリメントされる
