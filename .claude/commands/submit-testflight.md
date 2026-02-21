# /submit-testflight - TestFlight 提出

最新の iOS ビルドを TestFlight に提出します。

## 手順

1. **最新のローカルビルドを確認**:
   ```bash
   ls -t mobile/build-*.ipa | head -1
   ```
   `.ipa` ファイルが存在することを確認する。存在しない場合は `/build-ios` を案内して中断。

2. **提出を実行**:
   ```bash
   cd mobile && eas submit --platform ios --path <最新の.ipaファイル> --non-interactive
   ```
   `--path` でローカルビルドの `.ipa` ファイルを直接指定して提出する。

3. **提出結果を確認**:
   - 提出が成功したらユーザーに報告
   - App Store Connect で TestFlight のレビューステータスを確認するよう案内
   - TestFlight でテスターにビルドが配布されるまで数分〜数時間かかることを伝える

## 注意事項

- `eas submit` は EAS アカウントと App Store Connect の認証情報が設定済みであることが前提
- `eas.json` の `submit.production.ios.ascAppId` が `6759304369` に設定済み
- 提出前にビルドが存在しない場合は `/build-ios` を案内する
