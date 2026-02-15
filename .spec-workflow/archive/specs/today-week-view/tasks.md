# Tasks: today-week-view

## Task 1: 日付ユーティリティ関数の作成

- [x] 1. `lib/utils/date.ts` を作成
  - formatTime: ISO時間をJST "HH:mm" 形式に変換
  - formatDate: 日付を "M月D日（曜日）" 形式に変換
  - isToday: 指定日が今日かどうか判定

**Files:** `lib/utils/date.ts`
_Requirements: R1, R2_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** TypeScript ユーティリティ開発者

**Task:** 日付関連のユーティリティ関数を作成。ISO 8601形式の時間をJST表示に変換する関数群を実装。

**Restrictions:**
- 外部ライブラリ不使用（Date APIのみ）
- JSTタイムゾーン固定（Asia/Tokyo）
- 純粋関数として実装

**Success:**
- formatTime("2026-01-26T00:30:00.000Z") → "09:30"
- formatDate(new Date("2026-01-26")) → "1月26日（月）"
- isToday(new Date()) → true

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 2: イベントユーティリティ関数の作成

- [x] 2. `lib/utils/events.ts` を作成
  - groupEventsByDate: イベントを日付ごとにグループ化

**Files:** `lib/utils/events.ts`
_Requirements: R2_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** TypeScript ユーティリティ開発者

**Task:** イベントを日付でグループ化するユーティリティ関数を作成。

**Restrictions:**
- 既存のCalendarEvent型を使用
- 日付キーは "YYYY-MM-DD" 形式
- JSTベースでグループ化

**_Leverage:** `lib/domain/calendar/types.ts` のCalendarEvent型

**Success:**
- イベント配列を日付ごとのオブジェクトに変換
- 日付順にソート

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 3: useEvents フックの作成

- [x] 3. `hooks/useEvents.ts` を作成
  - range（today/week）に応じてAPIからイベント取得
  - ローディング状態、エラー状態を管理
  - refresh関数で再取得

**Files:** `hooks/useEvents.ts`
_Requirements: R1, R2, R5_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React Hooks 開発者

**Task:** イベントデータを取得・管理するカスタムフックを作成。

**Restrictions:**
- useState, useEffect, useCallback のみ使用
- SWRやReact Query不使用
- エラーハンドリング必須

**_Leverage:** `/api/events?range=today|week` API

**Success:**
```typescript
const { events, isLoading, error, refresh, lastSync } = useEvents('today');
```

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 4: EventCard コンポーネントの作成

- [x] 4. `components/calendar/EventCard.tsx` を作成
  - 時間、タイトル、場所を表示
  - カレンダー色を左端に表示
  - 終日イベントは「終日」表示

**Files:** `components/calendar/EventCard.tsx`
_Requirements: R1, R4_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React/Panda CSS コンポーネント開発者

**Task:** 単一イベントを表示するカードコンポーネントを作成。

**Restrictions:**
- Panda CSS のみ使用
- アクセシビリティ考慮（セマンティックHTML）
- レスポンシブデザイン

**_Leverage:**
- `lib/utils/date.ts` の formatTime
- Panda CSS の css 関数

**Success:**
- 時間表示: "09:30 - 10:00" または "終日"
- タイトル表示
- 場所表示（あれば）
- カレンダー色のライン（左端）

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 5: EventList コンポーネントの作成

- [x] 5. `components/calendar/EventList.tsx` を作成
  - EventCardのリスト表示
  - 空の場合はメッセージ表示

**Files:** `components/calendar/EventList.tsx`
_Requirements: R1_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React コンポーネント開発者

**Task:** イベントリストを表示するコンポーネントを作成。

**Restrictions:**
- EventCardを使用
- 空状態のメッセージをカスタマイズ可能に

**_Leverage:** `components/calendar/EventCard.tsx`

**Success:**
- イベント配列をEventCardで表示
- events.length === 0 の場合、emptyMessage表示

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 6: DayGroup コンポーネントの作成

- [x] 6. `components/calendar/DayGroup.tsx` を作成
  - 日付見出し + イベントリスト
  - 今日の場合は「今日」ラベル強調

**Files:** `components/calendar/DayGroup.tsx`
_Requirements: R2_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React コンポーネント開発者

**Task:** 日別グループを表示するコンポーネントを作成。

**Restrictions:**
- EventListを使用
- 今日の場合は視覚的に強調

**_Leverage:**
- `components/calendar/EventList.tsx`
- `lib/utils/date.ts` の formatDate, isToday

**Success:**
- 日付見出し: "1月26日（月）" + 今日なら「今日」バッジ
- その日のイベントリスト表示

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 7: ViewTabs コンポーネントの作成

- [x] 7. `components/calendar/ViewTabs.tsx` を作成
  - 「今日」「今週」タブ
  - アクティブ状態のスタイリング

**Files:** `components/calendar/ViewTabs.tsx`
_Requirements: R3_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React/Panda CSS コンポーネント開発者

**Task:** 今日/今週の表示切替タブを作成。

**Restrictions:**
- Panda CSS のみ
- キーボードアクセシビリティ対応
- role="tablist" 使用

**Success:**
- 「今日」「今週」の2つのタブ
- activeView に応じたスタイル切替
- onViewChange コールバック

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 8: TodayView コンポーネントの作成

- [x] 8. `components/calendar/TodayView.tsx` を作成
  - 今日の予定一覧
  - ローディング/エラー状態
  - 更新ボタン

**Files:** `components/calendar/TodayView.tsx`
_Requirements: R1, R5_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React コンポーネント開発者

**Task:** 今日の予定表示コンポーネントを作成。

**Restrictions:**
- EventList使用
- ローディング中はスピナー表示
- エラー時はリトライボタン

**_Leverage:**
- `components/calendar/EventList.tsx`
- Panda CSS

**Success:**
- 今日の予定一覧表示
- ローディング状態表示
- 更新ボタンでonRefresh呼び出し

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 9: WeekView コンポーネントの作成

- [x] 9. `components/calendar/WeekView.tsx` を作成
  - 今週の予定を日別表示
  - DayGroupを使用

**Files:** `components/calendar/WeekView.tsx`
_Requirements: R2, R5_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React コンポーネント開発者

**Task:** 今週の予定表示コンポーネントを作成。

**Restrictions:**
- DayGroup使用
- groupEventsByDate使用
- 日付順に表示

**_Leverage:**
- `components/calendar/DayGroup.tsx`
- `lib/utils/events.ts` の groupEventsByDate

**Success:**
- 今週の各日をDayGroupで表示
- 予定のない日も表示（「予定なし」）

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 10: TodayWeekView コンポーネントの作成

- [x] 10. `components/calendar/TodayWeekView.tsx` を作成
  - ViewTabs, TodayView, WeekView を統合
  - useEventsでデータ取得
  - タブ状態管理

**Files:** `components/calendar/TodayWeekView.tsx`
_Requirements: R1, R2, R3_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** React コンポーネント開発者

**Task:** メインコンテナコンポーネントを作成。全サブコンポーネントを統合。

**Restrictions:**
- useStateでタブ状態管理
- useEventsでデータ取得
- localStorage でタブ状態永続化

**_Leverage:**
- `components/calendar/ViewTabs.tsx`
- `components/calendar/TodayView.tsx`
- `components/calendar/WeekView.tsx`
- `hooks/useEvents.ts`

**Success:**
- タブ切替で今日/今週表示切替
- データ取得・表示
- タブ状態をlocalStorageに保存

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 11: メインページの更新

- [x] 11. `app/page.tsx` を更新
  - TodayWeekViewコンポーネントを配置
  - プレースホルダーを置き換え

**Files:** `app/page.tsx`
_Requirements: R1, R2, R3_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** Next.js 開発者

**Task:** メインページにTodayWeekViewを配置。

**Restrictions:**
- 既存のレイアウトを維持
- "use client" 必要に応じて追加

**_Leverage:** `components/calendar/TodayWeekView.tsx`

**Success:**
- / にアクセスで今日の予定が表示される
- タブ切替で今週表示に切り替わる

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>

## Task 12: E2Eテスト

- [x] 12. agent-browserでE2Eテスト実行
  - メイン画面表示確認
  - タブ切替動作確認
  - イベント表示確認

**Files:** なし（テスト実行のみ）
_Requirements: R1, R2, R3_

<details>
<summary>_Prompt_</summary>

Implement the task for spec today-week-view, first run spec-workflow-guide to get the workflow guide then implement the task:

**Role:** QAエンジニア

**Task:** agent-browserを使用してE2Eテストを実行。

**Restrictions:**
- agent-browser CLIを使用
- スクリーンショット不要

**Success:**
- http://localhost:3333 でメイン画面が表示される
- 「今日」「今週」タブが存在する
- イベントが表示される（または「予定はありません」）

**Instructions:** タスク開始時にtasks.mdの[ ]を[-]に変更。完了後にlog-implementationでログを記録し、[x]に変更。

</details>
