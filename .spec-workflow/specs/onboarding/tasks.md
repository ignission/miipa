# Tasks Document - Onboarding

## 概要

このタスクリストは、SoloDayオンボーディング機能の実装タスクを定義します。

- Requirements: `.spec-workflow/specs/onboarding/requirements.md`
- Design: `.spec-workflow/specs/onboarding/design.md`

---

## タスク一覧

- [x] 1. セットアップ状態確認ユースケースの実装
  - File: `lib/application/setup/check-setup-status.ts`, `lib/application/setup/types.ts`
  - セットアップ完了状態を確認するユースケースと型定義を実装
  - 初回起動かどうかの判定ロジックを含む
  - Purpose: 初回起動検出とセットアップ状態管理の基盤
  - _Leverage: `lib/config/loader.ts`（configExists, loadConfig）, `lib/infrastructure/keychain/index.ts`（hasSecret）, `lib/domain/shared/result.ts`, `lib/config/types.ts`（LLMProvider）_
  - _Requirements: 1_
  - _Prompt: Role: TypeScript/Node.js開発者、DDDとResult型パターンに精通 | Task: セットアップ状態確認ユースケースを実装。`SetupStatus`型（isComplete, currentProvider, hasApiKey）と`checkSetupStatus`関数、`isFirstLaunch`関数を作成。configExists→loadConfig→hasSecretの順で状態を確認し、Result型で結果を返す。プロバイダに応じたSecretKeyのマッピング関数も実装（claude→'anthropic-api-key', openai→'openai-api-key', ollama→'ollama-api-key'）。 | Restrictions: 既存のkeychain/config APIを使用、新規依存は追加しない、例外スローは禁止 | Success: 設定ファイル未存在/APIキー未保存/設定完了済みの3状態を正しく判別できる_

- [x] 2. APIキー検証ユースケースの実装
  - File: `lib/application/setup/validate-api-key.ts`
  - プロバイダ別のAPIキー形式検証と接続テストを実装
  - Claude/OpenAI/Ollamaそれぞれの検証ロジックを含む
  - Purpose: APIキーの有効性確認による設定ミス防止
  - _Leverage: `lib/domain/shared/result.ts`, `lib/application/setup/types.ts`_
  - _Requirements: 3_
  - _Prompt: Role: TypeScript開発者、外部API連携とエラーハンドリングに精通 | Task: `ApiKeyValidationError`型（code: INVALID_FORMAT/API_ERROR/TIMEOUT/NETWORK_ERROR, message, cause）を定義し、以下の関数を実装: (1)`validateApiKeyFormat` - Claude: `sk-ant-`プレフィックス、OpenAI: `sk-`プレフィックスの正規表現チェック (2)`validateClaudeKey` - Anthropic API `/v1/messages`へのテスト接続（claude-3-haiku、max_tokens:1、タイムアウト3秒） (3)`validateOpenAIKey` - OpenAI `/v1/models`エンドポイントで認証確認 (4)`validateOllamaConnection` - `http://localhost:11434/api/tags`への接続確認とモデル一覧取得 (5)`validateApiKey` - プロバイダに応じて適切な検証関数を呼び出す統合関数。すべてResult型を返す。 | Restrictions: SDKは使用せずfetchで直接API呼び出し、APIキーをログ出力しない、タイムアウト3秒 | Success: 各プロバイダの有効/無効なAPIキーを正しく判別し、具体的なエラーメッセージを返す_

- [x] 3. セットアップ設定保存ユースケースの実装
  - File: `lib/application/setup/save-setup-settings.ts`
  - APIキーのKeychain保存と設定ファイル更新を実装
  - 既存設定の上書き確認ロジックを含む
  - Purpose: 認証情報の安全な永続化
  - _Leverage: `lib/infrastructure/keychain/index.ts`（setSecret, hasSecret）, `lib/config/loader.ts`（loadOrInitializeConfig, saveConfig）, `lib/domain/shared/result.ts`, `lib/application/setup/types.ts`_
  - _Requirements: 4_
  - _Prompt: Role: TypeScript開発者、セキュリティとKeychain操作に精通 | Task: `SetupSettings`型（provider, apiKey?, baseUrl?, model?）と`SaveOptions`型（overwriteExisting?）を定義し、`saveSetupSettings`関数を実装。処理フロー: (1)既存APIキーの存在確認（overwriteExistingがfalseで存在する場合はエラー） (2)プロバイダに応じたSecretKeyでKeychainに保存（Claude/OpenAI: APIキー、Ollama: baseUrl） (3)設定ファイルのllm.providerを更新（loadOrInitializeConfig→更新→saveConfig）。Result<void, ConfigError | KeychainError>を返す。 | Restrictions: APIキーは保存後にメモリからクリア可能な設計、設定ファイルにAPIキーを含めない | Success: APIキーがKeychainに、プロバイダ設定がconfig.jsonに正しく保存される_

- [x] 4. セットアップ用API Routesの実装
  - File: `app/api/setup/check-status/route.ts`, `app/api/setup/validate-key/route.ts`, `app/api/setup/save-settings/route.ts`
  - 3つのAPI Routeを実装（状態確認、キー検証、設定保存）
  - Purpose: クライアントとサーバー間のセットアップデータ通信
  - _Leverage: `lib/application/setup/index.ts`（各ユースケース）, `lib/domain/shared/result.ts`_
  - _Requirements: 1, 3, 4_
  - _Prompt: Role: Next.js App Router開発者、API Routes設計に精通 | Task: 3つのAPI Routeを実装: (1)`GET /api/setup/check-status` - checkSetupStatusを呼び出し、`{isComplete, currentProvider?, hasApiKey}`をJSON返却 (2)`POST /api/setup/validate-key` - body`{provider, apiKey}`を受け取り、validateApiKeyを呼び出し、`{valid: boolean, error?: {code, message}}`を返却 (3)`POST /api/setup/save-settings` - body`{provider, apiKey?, baseUrl?, model?, overwriteExisting?}`を受け取り、saveSetupSettingsを呼び出し、`{success: boolean, error?: {code, message}, requiresConfirmation?: boolean}`を返却。エラー時は適切なHTTPステータスコード（400/401/500）。 | Restrictions: APIキーをレスポンスに含めない、ログ出力時にAPIキーをマスク | Success: 各エンドポイントが設計書通りのリクエスト/レスポンス形式で動作する_

- [x] 5. プロバイダ情報定義とセットアップStepper実装
  - File: `components/setup/types.ts`, `components/setup/SetupStepper.tsx`
  - プロバイダ表示情報（PROVIDER_INFO）とステップインジケータコンポーネント
  - Purpose: セットアップUIの基盤コンポーネント
  - _Leverage: `lib/config/types.ts`（LLMProvider）, Park UI（Steps）, Panda CSS_
  - _Requirements: 2, NFR-Usability_
  - _Prompt: Role: React/TypeScript開発者、Park UIとPanda CSSに精通 | Task: (1)`components/setup/types.ts`に`ProviderInfo`型と`PROVIDER_INFO`定数を定義。Claude: name='Claude (Anthropic)', isRecommended=true, apiKeyPattern=/^sk-ant-/, apiKeyHelpUrl='https://console.anthropic.com/settings/keys'。OpenAI: apiKeyPattern=/^sk-/, apiKeyHelpUrl='https://platform.openai.com/api-keys'。Ollama: requiresApiKey=false。 (2)`SetupStepper.tsx`を実装。Park UIのStepsコンポーネントを使用、3ステップ（プロバイダ選択/APIキー入力/完了）、currentStep propsで進捗表示。 | Restrictions: Park UIコンポーネントをそのまま活用、カスタムスタイルは最小限 | Success: 3ステップのインジケータが正しく表示され、現在のステップがハイライトされる_

- [x] 6. プロバイダ選択コンポーネントの実装
  - File: `components/setup/ProviderCard.tsx`, `components/setup/ProviderSelector.tsx`
  - 3つのプロバイダカードを表示する選択UIを実装
  - Claude推奨バッジ、選択時のハイライト表示を含む
  - Purpose: LLMプロバイダの視覚的な選択UI
  - _Leverage: `components/setup/types.ts`（PROVIDER_INFO）, Park UI（Card, Badge, RadioGroup）, Panda CSS_
  - _Requirements: 2_
  - _Prompt: Role: React/TypeScript開発者、アクセシブルなUI実装に精通 | Task: (1)`ProviderCard.tsx` - provider IDを受け取り、PROVIDER_INFOからname/description/isRecommendedを表示。Park UI Cardをベースに、isRecommended時は「推奨」Badgeを表示、選択時はボーダーカラーでハイライト。props: `{provider: LLMProvider, isSelected: boolean, onSelect: () => void, disabled?: boolean}` (2)`ProviderSelector.tsx` - 3つのProviderCardを横並び表示、RadioGroup的な排他選択。props: `{selectedProvider: LLMProvider | null, currentProvider?: LLMProvider, onSelect: (provider: LLMProvider) => void, disabled?: boolean}`。キーボードナビゲーション（Tab/矢印キー）対応。 | Restrictions: aria属性を適切に設定、Tab/Enterでの操作対応 | Success: 3つのカードが表示され、クリック/キーボードで選択でき、選択状態が視覚的にわかる_

- [x] 7. APIキー入力コンポーネントの実装
  - File: `components/setup/ApiKeyForm.tsx`
  - APIキー入力フォーム（マスク表示、検証ボタン、ヘルプリンク）
  - 検証中/成功/失敗の状態表示を含む
  - Purpose: APIキーの安全な入力と即時検証
  - _Leverage: `components/setup/types.ts`（PROVIDER_INFO）, Park UI（Input, Button, Alert, Spinner, Link）, Panda CSS_
  - _Requirements: 3_
  - _Prompt: Role: React/TypeScript開発者、フォームUXとセキュリティに精通 | Task: `ApiKeyForm.tsx`を実装。props: `{provider: LLMProvider, onValidated: (isValid: boolean) => void, onKeyChange: (key: string) => void}`。UI要素: (1)プロバイダロゴ（/icons/{provider}.svg）と名前表示 (2)APIキー入力（type="password"、目のアイコンで表示/非表示切替） (3)「APIキーの取得方法」リンク（PROVIDER_INFO.apiKeyHelpUrl、外部リンクアイコン付き） (4)「検証する」ボタン（disabled: 入力空時）。検証フロー: ボタンクリック→POST /api/setup/validate-key→成功時: Alert(variant="success")とonValidated(true)、失敗時: Alert(variant="error")でエラーメッセージ表示。検証中はSpinner表示。 | Restrictions: APIキーはStateに一時保持、ログ出力禁止、Enterキーで検証実行 | Success: APIキーの入力/検証/結果表示が正しく動作し、セキュアに扱われる_

- [x] 8. Ollama接続確認コンポーネントの実装
  - File: `components/setup/OllamaConnector.tsx`
  - Ollamaサーバーへの接続確認UIを実装
  - URL入力、接続テスト、利用可能モデル表示を含む
  - Purpose: Ollama使用時の接続確認とモデル選択
  - _Leverage: Park UI（Input, Button, Alert, Select）, Panda CSS_
  - _Requirements: 3_
  - _Prompt: Role: React/TypeScript開発者、ローカルサービス連携に精通 | Task: `OllamaConnector.tsx`を実装。props: `{onConnected: () => void, defaultUrl?: string}`。State: url（デフォルト'http://localhost:11434'）, status（idle/connecting/connected/error）, availableModels[], errorMessage。UI: (1)OllamaサーバーURL入力（Input） (2)「接続確認」ボタン→POST /api/setup/validate-key（provider='ollama', apiKey=url）→成功時: availableModelsにモデル一覧表示、statusをconnected、onConnected()呼び出し、失敗時: Alertでエラー表示（「Ollamaが起動していない場合は`ollama serve`を実行してください」等）。 | Restrictions: デフォルトURLはlocalhost、外部サーバーへの接続も許可 | Success: Ollamaサーバーへの接続確認が動作し、利用可能モデルが表示される_

- [x] 9. セットアップ完了画面コンポーネントの実装
  - File: `components/setup/SetupComplete.tsx`, `public/icons/meerkat-celebration.svg`
  - 完了画面（ミーアキャットイラスト、設定確認、開始ボタン）
  - 5秒後の自動リダイレクト機能を含む
  - Purpose: セットアップ完了の確認と次のアクションへの誘導
  - _Leverage: Park UI（Card, Button, Text）, Panda CSS, Next.js（useRouter）_
  - _Requirements: 5_
  - _Prompt: Role: React/TypeScript開発者、UXとアニメーションに精通 | Task: (1)`public/icons/meerkat-celebration.svg` - シンプルなミーアキャットの祝福イラスト（既存SVGアセットがあれば流用、なければプレースホルダ） (2)`SetupComplete.tsx`を実装。props: `{provider: LLMProvider, onStart: () => void, autoRedirectSeconds?: number}`（デフォルト5）。UI: ミーアキャットイラスト、「セットアップが完了しました！」メッセージ、選択プロバイダ名表示、「SoloDayを始める」ボタン（クリックでonStart()）。useEffectで自動リダイレクト: autoRedirectSeconds秒後にonStart()呼び出し、カウントダウン表示（「5秒後に自動的に移動します...」）。 | Restrictions: アニメーションは控えめに、アクセシビリティ配慮 | Success: 完了画面が表示され、ボタンクリックまたは5秒後に自動でメイン画面に遷移_

- [x] 10. セットアップページの実装
  - File: `app/setup/page.tsx`, `app/setup/layout.tsx`, `components/setup/SetupClientWrapper.tsx`
  - セットアップフローの統括ページ（3ステップ管理）
  - 初回起動/設定変更モードの判別を含む
  - Purpose: セットアップフロー全体の状態管理とUI統合
  - _Leverage: 全components/setup/*コンポーネント, `lib/application/setup`ユースケース, Next.js App Router_
  - _Requirements: 1, 2, 3, 4, 5_
  - _Prompt: Role: Next.js App Router開発者、状態管理に精通 | Task: (1)`app/setup/layout.tsx` - セットアップ専用レイアウト（ヘッダー「SoloDay セットアップ」、中央寄せコンテンツ） (2)`components/setup/SetupClientWrapper.tsx` - 'use client'、useState: currentStep('provider'/'key'/'complete'), selectedProvider, isValidated, apiKeyValue, isExistingSetup。ステップ遷移ロジック: プロバイダ選択→次へで'key'へ（Ollamaの場合はOllamaConnector表示）、検証成功→'complete'へ。設定保存: POST /api/setup/save-settings呼び出し。 (3)`app/setup/page.tsx` - Server Component、GET /api/setup/check-statusで初期状態取得、isComplete=trueなら設定変更モードとしてSetupClientWrapperに渡す。 | Restrictions: Server Componentで初期データ取得、Client Componentで状態管理 | Success: 3ステップのセットアップフローが正しく動作し、設定が保存される_

- [x] 11. メイン画面からのリダイレクトロジックの実装
  - File: `app/page.tsx`（修正）, `middleware.ts`（新規）
  - 未セットアップ時の/setupへの自動リダイレクト
  - Purpose: 初回起動時のスムーズなセットアップ誘導
  - _Leverage: Next.js middleware, `/api/setup/check-status`_
  - _Requirements: 1_
  - _Prompt: Role: Next.js開発者、middlewareとルーティングに精通 | Task: (1)`middleware.ts`を新規作成。`/`アクセス時にGET /api/setup/check-statusを呼び出し、isComplete=falseなら`/setup`にリダイレクト。matcher: ['/((?!api|_next|icons|setup).*)']で/setupと静的アセットを除外。 (2)`app/page.tsx`修正 - 既存のメイン画面コンポーネントに、セットアップ完了後のコンテンツを表示（現時点では「SoloDayへようこそ」のプレースホルダ）。 | Restrictions: middlewareはedge runtimeで動作、重い処理は避ける、/api/setup/check-statusの結果をキャッシュしない | Success: 未セットアップ状態で/アクセス時に/setupにリダイレクトされる_

- [x] 12. 設定変更（再セットアップ）対応の実装
  - File: `components/setup/SetupClientWrapper.tsx`（修正）
  - 既存設定表示、キー変更ボタン、キャンセルボタンの追加
  - Purpose: セットアップ完了後の設定変更サポート
  - _Leverage: 既存components/setup/*_
  - _Requirements: 6_
  - _Prompt: Role: React/TypeScript開発者 | Task: `SetupClientWrapper.tsx`を修正。isExistingSetup=true時の表示: (1)現在のプロバイダをハイライト表示した状態でProviderSelectorを表示 (2)「キーを変更する」ボタン→クリックでcurrentStepを'key'に、別プロバイダ選択時も'key'に (3)「キャンセル」ボタン→クリックで`/`にリダイレクト（router.push('/')）。APIキー入力画面: 既存キーの存在を警告表示（「現在のAPIキーを上書きします」）、保存時にoverwriteExisting=trueを送信。 | Restrictions: キャンセル時は設定を変更しない | Success: 設定変更モードでの表示/操作が正しく動作し、変更またはキャンセルできる_

- [x] 13. プロバイダアイコンSVGの追加
  - File: `public/icons/anthropic.svg`, `public/icons/openai.svg`, `public/icons/ollama.svg`
  - 3つのプロバイダのロゴSVGファイルを追加
  - Purpose: プロバイダ選択UIの視覚的識別
  - _Requirements: 2, NFR-Usability_
  - _Prompt: Role: フロントエンド開発者 | Task: 3つのSVGファイルを作成/追加: (1)`anthropic.svg` - Anthropicロゴ（シンプルな形状、ブランドカラー#D4A27F） (2)`openai.svg` - OpenAIロゴ（シンプルな形状、ブランドカラー#00A67E） (3)`ollama.svg` - Ollamaロゴ（ラマのシルエット、ブランドカラー#000000）。各ファイルは24x24または32x32のviewBox、単色で汎用的に使用可能なデザイン。 | Restrictions: ライセンスに注意、公式ロゴの直接使用は避けシンプルな代替デザインで可 | Success: 3つのアイコンが/icons/以下に配置され、コンポーネントから参照可能_

- [x] 14. セットアップアプリケーション層のindex.tsエクスポート
  - File: `lib/application/setup/index.ts`
  - セットアップ関連の型と関数を一括エクスポート
  - Purpose: モジュールの公開インターフェース整備
  - _Leverage: `lib/application/setup/*.ts`_
  - _Requirements: NFR-Modularity_
  - _Prompt: Role: TypeScript開発者 | Task: `lib/application/setup/index.ts`を作成。以下をエクスポート: (1)types.tsから: SetupSettings, SetupStatus, ApiKeyValidationError, ApiKeyValidationErrorCode, OllamaConnectionResult (2)check-setup-status.tsから: checkSetupStatus, isFirstLaunch (3)validate-api-key.tsから: validateApiKey, validateApiKeyFormat, validateClaudeKey, validateOpenAIKey, validateOllamaConnection (4)save-setup-settings.tsから: saveSetupSettings。型エクスポートは`export type`を使用。 | Restrictions: 内部実装の詳細は公開しない | Success: `import { checkSetupStatus, validateApiKey, saveSetupSettings } from '@/lib/application/setup'`で利用可能_

- [x] 15. セットアップコンポーネントのindex.tsエクスポート
  - File: `components/setup/index.ts`
  - セットアップUIコンポーネントを一括エクスポート
  - Purpose: コンポーネントの公開インターフェース整備
  - _Leverage: `components/setup/*.tsx`_
  - _Requirements: NFR-Modularity_
  - _Prompt: Role: TypeScript/React開発者 | Task: `components/setup/index.ts`を作成。以下をエクスポート: (1)types.tsから: ProviderInfo, PROVIDER_INFO (2)SetupStepper (3)ProviderCard (4)ProviderSelector (5)ApiKeyForm (6)OllamaConnector (7)SetupComplete (8)SetupClientWrapper。 | Restrictions: 内部ヘルパー関数は公開しない | Success: `import { ProviderSelector, ApiKeyForm } from '@/components/setup'`で利用可能_

---

## 依存関係

```
タスク1 (状態確認UC) ─┬─> タスク4 (API Routes) ─┬─> タスク10 (セットアップページ)
タスク2 (検証UC) ────┘                          │
タスク3 (保存UC) ─────────────────────────────┘
                                               │
タスク5 (Stepper/型) ─┬─> タスク6 (プロバイダ選択) ─┬─> タスク10
タスク13 (アイコン) ──┘                             │
                                                  │
タスク7 (APIキー入力) ──────────────────────────────┤
タスク8 (Ollama接続) ───────────────────────────────┤
タスク9 (完了画面) ─────────────────────────────────┘
                                                  │
タスク10 ─────────────────────────────────────────> タスク11 (リダイレクト)
                                                  │
タスク10 ─────────────────────────────────────────> タスク12 (設定変更)
                                                  │
タスク1,2,3 ──────────────────────────────────────> タスク14 (UC index.ts)
タスク5,6,7,8,9 ──────────────────────────────────> タスク15 (コンポーネント index.ts)
```

## 実装順序の推奨

1. **Phase 1: 基盤（タスク1, 2, 3, 14）** - ユースケース層の実装
2. **Phase 2: API（タスク4）** - API Routesの実装
3. **Phase 3: UIコンポーネント（タスク5, 6, 7, 8, 9, 13, 15）** - 個別UIの実装
4. **Phase 4: 統合（タスク10, 11, 12）** - ページ統合とルーティング

---

## 完了基準

- すべてのタスクが完了していること
- `npm run build` が成功すること
- `npx biome check .` でエラーがないこと
- 初回起動時に/setupにリダイレクトされること
- 3プロバイダ（Claude/OpenAI/Ollama）の選択・設定が動作すること
- APIキーがKeychainに保存されること
- セットアップ完了後にメイン画面に遷移すること
- 設定変更モードが動作すること
