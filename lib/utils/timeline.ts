/**
 * タイムラインユーティリティモジュール
 *
 * このモジュールはカレンダーのタイムライン表示に必要な機能を提供します。
 * - eventsOverlap: 2つのイベントの時間重複判定
 * - assignColumns: 重複イベントへの列割り当て
 * - getEventStatus: イベントのステータス判定
 * - calculateEventPosition: イベントの位置計算
 * - prepareTimelineEvents: タイムライン表示用のイベント変換
 *
 * すべての関数は純粋関数として実装されています。
 *
 * @module lib/utils/timeline
 */

// ============================================================
// 型定義
// ============================================================

/**
 * イベントのステータス
 * - past: 終了済み
 * - current: 現在進行中
 * - next: 次のイベント（未来イベントの中で最初のもの）
 * - future: 将来のイベント
 */
export type EventStatus = "past" | "current" | "next" | "future";

/**
 * タイムライン表示用のイベント
 */
export interface TimelineEvent {
	/** イベントの一意識別子 */
	id: string;
	/** イベントのタイトル */
	title: string;
	/** 開始時刻（ISO 8601形式） */
	startTime: string;
	/** 終了時刻（ISO 8601形式） */
	endTime: string;
	/** 終日イベントかどうか */
	isAllDay: boolean;
	/** 場所（nullの場合は未設定） */
	location: string | null;
	/** イベントのソース情報 */
	source: {
		/** カレンダーの種類 */
		type: "google" | "ical";
		/** カレンダー名 */
		calendarName: string;
		/** アカウントのメールアドレス（Googleの場合） */
		accountEmail?: string;
	};
	/** 表示色（オプション） */
	color?: string;
	/** タイムライン配置用: 列番号（0始まり） */
	column: number;
	/** タイムライン配置用: 合計列数 */
	totalColumns: number;
	/** イベントのステータス */
	status: EventStatus;
}

/**
 * イベントの位置情報
 */
export interface EventPosition {
	/** 上端の位置（%） */
	top: number;
	/** 高さ（%） */
	height: number;
}

/**
 * 入力イベントの型（TimelineEventから配置情報を除いたもの）
 */
export type InputEvent = Omit<
	TimelineEvent,
	"column" | "totalColumns" | "status"
>;

// ============================================================
// eventsOverlap - 2つのイベントの時間重複判定
// ============================================================

/**
 * 2つのイベントが時間的に重複しているかを判定します
 *
 * 重複条件: A開始 < B終了 かつ B開始 < A終了
 * 境界が一致する場合（A終了 = B開始）は重複とみなしません。
 *
 * @param eventA - 比較対象のイベントA
 * @param eventB - 比較対象のイベントB
 * @returns 重複している場合true、それ以外はfalse
 *
 * @example
 * ```typescript
 * // 重複あり: 9:00-10:00 と 9:30-10:30
 * eventsOverlap(
 *   { startTime: "2026-01-27T09:00:00Z", endTime: "2026-01-27T10:00:00Z", ... },
 *   { startTime: "2026-01-27T09:30:00Z", endTime: "2026-01-27T10:30:00Z", ... }
 * ); // true
 *
 * // 重複なし: 9:00-10:00 と 10:00-11:00（境界一致）
 * eventsOverlap(
 *   { startTime: "2026-01-27T09:00:00Z", endTime: "2026-01-27T10:00:00Z", ... },
 *   { startTime: "2026-01-27T10:00:00Z", endTime: "2026-01-27T11:00:00Z", ... }
 * ); // false
 * ```
 */
export function eventsOverlap(
	eventA: Pick<InputEvent, "startTime" | "endTime">,
	eventB: Pick<InputEvent, "startTime" | "endTime">,
): boolean {
	const aStart = new Date(eventA.startTime).getTime();
	const aEnd = new Date(eventA.endTime).getTime();
	const bStart = new Date(eventB.startTime).getTime();
	const bEnd = new Date(eventB.endTime).getTime();

	// A開始 < B終了 かつ B開始 < A終了
	return aStart < bEnd && bStart < aEnd;
}

// ============================================================
// assignColumns - 重複イベントへの列割り当て
// ============================================================

/**
 * 列割り当て結果の型
 */
interface ColumnAssignment {
	/** イベントID */
	id: string;
	/** 割り当てられた列番号（0始まり） */
	column: number;
}

/**
 * 重複するイベントに列を割り当てます（貪欲法）
 *
 * 開始時刻でソートし、各イベントを「重複しない最小の列」に配置します。
 * 各列の終了時刻を追跡して、新しいイベントがどの列に配置可能かを判定します。
 *
 * @param events - 列を割り当てるイベントの配列
 * @returns イベントIDと列番号のマッピング配列
 *
 * @example
 * ```typescript
 * const events = [
 *   { id: "1", startTime: "2026-01-27T09:00:00Z", endTime: "2026-01-27T10:00:00Z", ... },
 *   { id: "2", startTime: "2026-01-27T09:30:00Z", endTime: "2026-01-27T10:30:00Z", ... },
 *   { id: "3", startTime: "2026-01-27T10:00:00Z", endTime: "2026-01-27T11:00:00Z", ... },
 * ];
 * assignColumns(events);
 * // [{ id: "1", column: 0 }, { id: "2", column: 1 }, { id: "3", column: 0 }]
 * ```
 */
export function assignColumns(
	events: ReadonlyArray<Pick<InputEvent, "id" | "startTime" | "endTime">>,
): ColumnAssignment[] {
	if (events.length === 0) {
		return [];
	}

	// 開始時刻でソート
	const sortedEvents = [...events].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
	);

	// 各列の終了時刻を追跡（列番号 -> 終了時刻のタイムスタンプ）
	const columnEndTimes: number[] = [];
	const assignments: ColumnAssignment[] = [];

	for (const event of sortedEvents) {
		const eventStart = new Date(event.startTime).getTime();
		const eventEnd = new Date(event.endTime).getTime();

		// 重複しない最小の列を探す
		let assignedColumn = -1;
		for (let col = 0; col < columnEndTimes.length; col++) {
			if (columnEndTimes[col] <= eventStart) {
				assignedColumn = col;
				break;
			}
		}

		// 既存の列に配置できない場合は新しい列を追加
		if (assignedColumn === -1) {
			assignedColumn = columnEndTimes.length;
			columnEndTimes.push(eventEnd);
		} else {
			columnEndTimes[assignedColumn] = eventEnd;
		}

		assignments.push({ id: event.id, column: assignedColumn });
	}

	return assignments;
}

// ============================================================
// getEventStatus - イベントのステータス判定
// ============================================================

/**
 * イベントのステータスを判定します
 *
 * - past: 終了時刻 ≤ 現在時刻
 * - current: 開始時刻 ≤ 現在時刻 < 終了時刻
 * - next: 現在時刻 < 開始時刻（未来イベントの中で最初のもの）
 * - future: 現在時刻 < 開始時刻（nextイベント以外）
 *
 * 注意: この関数は単一イベントのステータスを判定します。
 * "next"と"future"の区別は呼び出し側で行う必要があります。
 * 未来イベントの場合、この関数は"future"を返します。
 *
 * @param event - ステータスを判定するイベント
 * @param now - 現在時刻
 * @returns イベントのステータス（"past", "current", または "future"）
 *
 * @example
 * ```typescript
 * const now = new Date("2026-01-27T10:00:00Z");
 *
 * // 過去のイベント
 * getEventStatus(
 *   { startTime: "2026-01-27T08:00:00Z", endTime: "2026-01-27T09:00:00Z", ... },
 *   now
 * ); // "past"
 *
 * // 現在進行中のイベント
 * getEventStatus(
 *   { startTime: "2026-01-27T09:30:00Z", endTime: "2026-01-27T10:30:00Z", ... },
 *   now
 * ); // "current"
 *
 * // 未来のイベント
 * getEventStatus(
 *   { startTime: "2026-01-27T11:00:00Z", endTime: "2026-01-27T12:00:00Z", ... },
 *   now
 * ); // "future"
 * ```
 */
export function getEventStatus(
	event: Pick<InputEvent, "startTime" | "endTime">,
	now: Date,
): Exclude<EventStatus, "next"> {
	const eventStart = new Date(event.startTime).getTime();
	const eventEnd = new Date(event.endTime).getTime();
	const nowTime = now.getTime();

	if (eventEnd <= nowTime) {
		return "past";
	}

	if (eventStart <= nowTime && nowTime < eventEnd) {
		return "current";
	}

	return "future";
}

// ============================================================
// calculateEventPosition - イベントの位置計算
// ============================================================

/**
 * イベントの表示位置を計算します
 *
 * 1日の時間範囲に対するイベントの相対位置（%）を計算します。
 * イベントが1日の範囲をはみ出す場合は、範囲内にクリップされます。
 *
 * @param startTime - イベントの開始時刻（ISO 8601形式）
 * @param endTime - イベントの終了時刻（ISO 8601形式）
 * @param dayStart - 1日の開始時刻（ISO 8601形式）
 * @param dayEnd - 1日の終了時刻（ISO 8601形式）
 * @returns イベントの位置情報（top: 上端位置%, height: 高さ%）
 *
 * @example
 * ```typescript
 * // 1日を0:00-24:00として、9:00-10:00のイベント
 * calculateEventPosition(
 *   "2026-01-27T09:00:00+09:00",
 *   "2026-01-27T10:00:00+09:00",
 *   "2026-01-27T00:00:00+09:00",
 *   "2026-01-28T00:00:00+09:00"
 * );
 * // { top: 37.5, height: 4.166... }
 * // (9時間 / 24時間 = 37.5%, 1時間 / 24時間 ≈ 4.17%)
 * ```
 */
export function calculateEventPosition(
	startTime: string,
	endTime: string,
	dayStart: string,
	dayEnd: string,
): EventPosition {
	const eventStartMs = new Date(startTime).getTime();
	const eventEndMs = new Date(endTime).getTime();
	const dayStartMs = new Date(dayStart).getTime();
	const dayEndMs = new Date(dayEnd).getTime();

	const dayDuration = dayEndMs - dayStartMs;

	if (dayDuration <= 0) {
		return { top: 0, height: 0 };
	}

	// イベントを1日の範囲内にクリップ
	const clippedStart = Math.max(eventStartMs, dayStartMs);
	const clippedEnd = Math.min(eventEndMs, dayEndMs);

	// イベントが完全に範囲外の場合
	if (clippedStart >= clippedEnd) {
		return { top: 0, height: 0 };
	}

	const top = ((clippedStart - dayStartMs) / dayDuration) * 100;
	const height = ((clippedEnd - clippedStart) / dayDuration) * 100;

	return { top, height };
}

// ============================================================
// prepareTimelineEvents - タイムライン表示用のイベント変換
// ============================================================

/**
 * タイムライン表示の準備結果
 */
export interface PreparedTimeline {
	/** 終日イベントの配列 */
	allDayEvents: TimelineEvent[];
	/** 時間指定イベントの配列 */
	timedEvents: TimelineEvent[];
}

/**
 * イベント配列をタイムライン表示用に変換します
 *
 * 以下の処理を行います:
 * 1. 終日イベントと時間指定イベントを分離
 * 2. 時間指定イベントに列を割り当て
 * 3. 各イベントにステータスを設定（"next"は最初の未来イベントのみ）
 *
 * @param events - 変換するイベントの配列
 * @param now - 現在時刻
 * @returns 終日イベントと時間指定イベントに分離されたタイムラインデータ
 *
 * @example
 * ```typescript
 * const events = [
 *   { id: "1", title: "Meeting", isAllDay: false, startTime: "...", endTime: "...", ... },
 *   { id: "2", title: "Holiday", isAllDay: true, startTime: "...", endTime: "...", ... },
 * ];
 * const result = prepareTimelineEvents(events, new Date());
 * // { allDayEvents: [...], timedEvents: [...] }
 * ```
 */
export function prepareTimelineEvents(
	events: ReadonlyArray<InputEvent>,
	now: Date,
): PreparedTimeline {
	// 終日イベントと時間指定イベントを分離
	const allDayInputEvents: InputEvent[] = [];
	const timedInputEvents: InputEvent[] = [];

	for (const event of events) {
		if (event.isAllDay) {
			allDayInputEvents.push(event);
		} else {
			timedInputEvents.push(event);
		}
	}

	// 時間指定イベントに列を割り当て
	const columnAssignments = assignColumns(timedInputEvents);
	const columnMap = new Map(columnAssignments.map((a) => [a.id, a.column]));

	// 各イベントが重なっているグループごとにtotalColumnsを計算
	// これにより、3つ重なっていれば33.3%、4つ重なっていれば25%ずつになる
	const totalColumnsMap = calculateTotalColumnsPerEvent(
		timedInputEvents,
		columnAssignments,
	);

	// 開始時刻でソートして"next"イベントを特定
	const sortedTimedEvents = [...timedInputEvents].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
	);

	// 最初の未来イベントを見つける
	let nextEventId: string | null = null;
	for (const event of sortedTimedEvents) {
		const status = getEventStatus(event, now);
		if (status === "future") {
			nextEventId = event.id;
			break;
		}
	}

	// TimelineEvent配列を構築
	const timedEvents: TimelineEvent[] = timedInputEvents.map((event) => {
		const baseStatus = getEventStatus(event, now);
		const status: EventStatus = event.id === nextEventId ? "next" : baseStatus;

		return {
			...event,
			column: columnMap.get(event.id) ?? 0,
			totalColumns: totalColumnsMap.get(event.id) ?? 1,
			status,
		};
	});

	// 終日イベントも同様にステータスを設定
	const allDayEvents: TimelineEvent[] = allDayInputEvents.map((event) => {
		const baseStatus = getEventStatus(event, now);

		return {
			...event,
			column: 0,
			totalColumns: 1,
			status: baseStatus,
		};
	});

	return { allDayEvents, timedEvents };
}

// ============================================================
// 補助関数
// ============================================================

/**
 * 重複するイベントグループの合計列数を計算します
 *
 * 同じ時間帯に重複するイベントのグループごとに
 * 必要な列数を計算します。
 *
 * @param events - イベントの配列
 * @param columnAssignments - 列割り当て結果
 * @returns イベントIDと合計列数のマップ
 *
 * @internal
 */
export function calculateTotalColumnsPerEvent(
	events: ReadonlyArray<Pick<InputEvent, "id" | "startTime" | "endTime">>,
	columnAssignments: ColumnAssignment[],
): Map<string, number> {
	const columnMap = new Map(columnAssignments.map((a) => [a.id, a.column]));
	const result = new Map<string, number>();

	// 各イベントについて、重複するイベント群の最大列数を計算
	for (const event of events) {
		const overlappingEvents = events.filter((other) =>
			eventsOverlap(event, other),
		);

		const maxColumn = Math.max(
			...overlappingEvents.map((e) => columnMap.get(e.id) ?? 0),
		);

		result.set(event.id, maxColumn + 1);
	}

	return result;
}
