# Design Document: today-week-view

## Overview

メイン画面（/）に「今日」と「今週」の予定を表示する機能を実装します。既存の `/api/events` APIを活用し、シンプルで見やすいUIを提供します。

## Code Reuse Analysis

### Existing Components to Leverage
- **`/api/events`**: イベント取得API（range=today, range=week対応済み）
- **`css` from styled-system**: Panda CSSスタイリング
- **Park UI コンポーネント**: Tabs, Spinner などの基本UI

### Integration Points
- **Events API**: `GET /api/events?range=today|week` でイベント取得
- **Sync API**: `POST /api/calendars/sync` で手動同期

## Architecture

```mermaid
graph TD
    A[app/page.tsx] --> B[TodayWeekView]
    B --> C[ViewTabs]
    B --> D[TodayView]
    B --> E[WeekView]
    D --> F[EventList]
    E --> G[DayGroup]
    G --> F
    F --> H[EventCard]
    B --> I[useEvents hook]
    I --> J[/api/events]
```

## Components and Interfaces

### TodayWeekView (メインコンテナ)
- **Purpose:** 今日/今週表示の親コンポーネント
- **Location:** `components/calendar/TodayWeekView.tsx`
- **Props:** なし（内部で状態管理）
- **Dependencies:** ViewTabs, TodayView, WeekView, useEvents

### ViewTabs (タブ切替)
- **Purpose:** 今日/今週の表示切替タブ
- **Location:** `components/calendar/ViewTabs.tsx`
- **Props:**
  ```typescript
  interface ViewTabsProps {
    activeView: 'today' | 'week';
    onViewChange: (view: 'today' | 'week') => void;
  }
  ```
- **Dependencies:** Panda CSS

### TodayView (今日の予定)
- **Purpose:** 今日の予定一覧を表示
- **Location:** `components/calendar/TodayView.tsx`
- **Props:**
  ```typescript
  interface TodayViewProps {
    events: CalendarEvent[];
    isLoading: boolean;
    onRefresh: () => void;
  }
  ```
- **Dependencies:** EventList

### WeekView (今週の予定)
- **Purpose:** 今週の予定を日別グループで表示
- **Location:** `components/calendar/WeekView.tsx`
- **Props:**
  ```typescript
  interface WeekViewProps {
    events: CalendarEvent[];
    isLoading: boolean;
    onRefresh: () => void;
  }
  ```
- **Dependencies:** DayGroup, EventList

### DayGroup (日別グループ)
- **Purpose:** 特定日の予定をグループ化して表示
- **Location:** `components/calendar/DayGroup.tsx`
- **Props:**
  ```typescript
  interface DayGroupProps {
    date: Date;
    events: CalendarEvent[];
    isToday: boolean;
  }
  ```
- **Dependencies:** EventList

### EventList (イベント一覧)
- **Purpose:** イベントのリスト表示
- **Location:** `components/calendar/EventList.tsx`
- **Props:**
  ```typescript
  interface EventListProps {
    events: CalendarEvent[];
    emptyMessage?: string;
  }
  ```
- **Dependencies:** EventCard

### EventCard (イベントカード)
- **Purpose:** 単一イベントの表示
- **Location:** `components/calendar/EventCard.tsx`
- **Props:**
  ```typescript
  interface EventCardProps {
    event: CalendarEvent;
  }
  ```
- **Dependencies:** なし

### useEvents (データ取得Hook)
- **Purpose:** イベントデータの取得と状態管理
- **Location:** `hooks/useEvents.ts`
- **Interface:**
  ```typescript
  function useEvents(range: 'today' | 'week'): {
    events: CalendarEvent[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
    lastSync: Date | null;
  }
  ```

## Data Models

### CalendarEvent (既存の型を使用)
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  isAllDay: boolean;
  location: string | null;
  description: string | null;
  source: {
    type: 'google' | 'ical';
    calendarName: string;
    accountEmail?: string;
  };
}
```

### GroupedEvents (週表示用)
```typescript
interface GroupedEvents {
  [dateKey: string]: CalendarEvent[]; // dateKey: "2026-01-26"
}
```

## Error Handling

### Error Scenarios

1. **API通信エラー**
   - **Handling:** エラーメッセージを表示、リトライボタン提供
   - **User Impact:** 「予定の取得に失敗しました。再試行してください」

2. **空のイベント**
   - **Handling:** 空状態のメッセージを表示
   - **User Impact:** 「今日の予定はありません」

3. **同期中エラー**
   - **Handling:** トースト通知でエラー表示
   - **User Impact:** 「同期に失敗しました」

## Utility Functions

### formatTime (時間フォーマット)
- **Location:** `lib/utils/date.ts`
- **Purpose:** ISO時間をJST表示形式に変換
```typescript
function formatTime(isoString: string): string
// "2026-01-26T00:30:00.000Z" → "09:30"
```

### formatDate (日付フォーマット)
- **Location:** `lib/utils/date.ts`
- **Purpose:** 日付を日本語形式に変換
```typescript
function formatDate(date: Date): string
// Date → "1月26日（月）"
```

### groupEventsByDate (日別グループ化)
- **Location:** `lib/utils/events.ts`
- **Purpose:** イベントを日付ごとにグループ化
```typescript
function groupEventsByDate(events: CalendarEvent[]): GroupedEvents
```

### isToday (今日判定)
- **Location:** `lib/utils/date.ts`
- **Purpose:** 指定日が今日かどうか判定
```typescript
function isToday(date: Date): boolean
```

## Testing Strategy

### Unit Testing
- useEvents フックのテスト（モックAPI）
- 日付ユーティリティ関数のテスト
- イベントグループ化ロジックのテスト

### Integration Testing
- API連携のテスト
- タブ切替の動作テスト

### End-to-End Testing
- 画面表示の確認（agent-browser使用）
- タブ切替操作の確認
