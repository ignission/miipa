/**
 * 共通型定義モジュール
 *
 * このモジュールはドメイン全体で使用される共通型を提供します。
 * - Brand型: 型安全なID（文字列の誤用を防止）
 * - CalendarId, EventId: ブランド化されたID型
 * - TimeRange: 不変の時間範囲
 * - DateRange: 日付範囲の表現
 * - NonEmptyArray: 最低1要素を保証する配列型
 *
 * @module lib/domain/shared/types
 */

// ============================================================
// Brand型 - 型安全なIDのためのユーティリティ
// ============================================================

/**
 * ブランド型のためのユーティリティ型
 *
 * プリミティブ型に「タグ」を付けることで、異なる意味を持つ値を
 * コンパイル時に区別できるようにします。
 *
 * @template K - ベースとなる型（通常はstring）
 * @template T - ブランドの識別子（リテラル型）
 *
 * @example
 * ```typescript
 * type UserId = Brand<string, 'UserId'>;
 * type PostId = Brand<string, 'PostId'>;
 *
 * const userId: UserId = createCalendarId('user-123');
 * const postId: PostId = ... // userId を代入するとコンパイルエラー
 * ```
 */
export type Brand<K, T> = K & { readonly __brand: T };

// ============================================================
// CalendarId - カレンダーを一意に識別するID
// ============================================================

/**
 * カレンダーを一意に識別するためのブランド型
 *
 * 通常の文字列と区別するため、専用のコンストラクタ関数を使用して作成します。
 *
 * @example
 * ```typescript
 * const id = createCalendarId('cal-abc123');
 * // id は CalendarId 型として扱われる
 * ```
 */
export type CalendarId = Brand<string, "CalendarId">;

/**
 * CalendarIdを作成します
 *
 * @param value - カレンダーID文字列
 * @returns CalendarId型のブランド化された値
 *
 * @example
 * ```typescript
 * const calendarId = createCalendarId('google-calendar-main');
 * ```
 */
export function createCalendarId(value: string): CalendarId {
	return value as CalendarId;
}

/**
 * 値がCalendarIdとして有効かどうかを検証します
 *
 * @param value - 検証対象の値
 * @returns 値が空でない文字列の場合true
 *
 * @example
 * ```typescript
 * if (isValidCalendarId(userInput)) {
 *   const id = createCalendarId(userInput);
 * }
 * ```
 */
export function isValidCalendarId(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}

// ============================================================
// EventId - イベントを一意に識別するID
// ============================================================

/**
 * カレンダーイベントを一意に識別するためのブランド型
 *
 * 通常の文字列と区別するため、専用のコンストラクタ関数を使用して作成します。
 *
 * @example
 * ```typescript
 * const id = createEventId('event-xyz789');
 * // id は EventId 型として扱われる
 * ```
 */
export type EventId = Brand<string, "EventId">;

/**
 * EventIdを作成します
 *
 * @param value - イベントID文字列
 * @returns EventId型のブランド化された値
 *
 * @example
 * ```typescript
 * const eventId = createEventId('meeting-2026-01-26');
 * ```
 */
export function createEventId(value: string): EventId {
	return value as EventId;
}

/**
 * 値がEventIdとして有効かどうかを検証します
 *
 * @param value - 検証対象の値
 * @returns 値が空でない文字列の場合true
 *
 * @example
 * ```typescript
 * if (isValidEventId(userInput)) {
 *   const id = createEventId(userInput);
 * }
 * ```
 */
export function isValidEventId(value: unknown): value is string {
	return typeof value === "string" && value.length > 0;
}

// ============================================================
// TimeRange - 不変の時間範囲インターフェース
// ============================================================

/**
 * 開始日時と終了日時を持つ時間範囲
 *
 * すべてのプロパティはreadonlyで、イミュータブルな設計です。
 *
 * @property start - 範囲の開始日時
 * @property end - 範囲の終了日時
 *
 * @example
 * ```typescript
 * const range: TimeRange = {
 *   start: new Date('2026-01-26T09:00:00'),
 *   end: new Date('2026-01-26T10:00:00')
 * };
 * ```
 */
export interface TimeRange {
	/** 範囲の開始日時 */
	readonly start: Date;
	/** 範囲の終了日時 */
	readonly end: Date;
}

/**
 * TimeRangeを作成します
 *
 * @param start - 開始日時
 * @param end - 終了日時
 * @returns 不変のTimeRangeオブジェクト
 *
 * @example
 * ```typescript
 * const range = createTimeRange(
 *   new Date('2026-01-26T09:00:00'),
 *   new Date('2026-01-26T10:00:00')
 * );
 * ```
 */
export function createTimeRange(start: Date, end: Date): TimeRange {
	return Object.freeze({ start, end });
}

/**
 * TimeRangeが有効かどうかを検証します
 *
 * 有効な条件:
 * - startとendが有効なDate
 * - startがend以前である
 *
 * @param range - 検証対象のTimeRange
 * @returns 有効な場合true
 *
 * @example
 * ```typescript
 * const range = createTimeRange(start, end);
 * if (isValidTimeRange(range)) {
 *   // 安全に使用できる
 * }
 * ```
 */
export function isValidTimeRange(range: TimeRange): boolean {
	return (
		range.start instanceof Date &&
		range.end instanceof Date &&
		!Number.isNaN(range.start.getTime()) &&
		!Number.isNaN(range.end.getTime()) &&
		range.start.getTime() <= range.end.getTime()
	);
}

// ============================================================
// DateRange - 日付範囲のユニオン型
// ============================================================

/**
 * 日付範囲を表すユニオン型
 *
 * プリセット値または具体的なTimeRangeのいずれかを指定できます。
 *
 * - 'today': 今日の範囲
 * - 'thisWeek': 今週の範囲（日曜始まり）
 * - 'thisMonth': 今月の範囲
 * - TimeRange: 具体的な開始・終了日時
 *
 * @example
 * ```typescript
 * // プリセット値を使用
 * const todayRange: DateRange = 'today';
 *
 * // カスタム範囲を使用
 * const customRange: DateRange = {
 *   start: new Date('2026-01-01'),
 *   end: new Date('2026-01-31')
 * };
 * ```
 */
export type DateRange = "today" | "thisWeek" | "thisMonth" | TimeRange;

/**
 * DateRangeがプリセット値かどうかを判定します
 *
 * @param range - 判定対象のDateRange
 * @returns プリセット値（文字列リテラル）の場合true
 *
 * @example
 * ```typescript
 * if (isPresetDateRange(range)) {
 *   // range は 'today' | 'thisWeek' | 'thisMonth'
 * } else {
 *   // range は TimeRange
 * }
 * ```
 */
export function isPresetDateRange(
	range: DateRange,
): range is "today" | "thisWeek" | "thisMonth" {
	return range === "today" || range === "thisWeek" || range === "thisMonth";
}

/**
 * DateRangeがTimeRangeかどうかを判定します
 *
 * @param range - 判定対象のDateRange
 * @returns TimeRangeオブジェクトの場合true
 *
 * @example
 * ```typescript
 * if (isTimeRangeDateRange(range)) {
 *   // range.start と range.end にアクセス可能
 *   console.log(range.start, range.end);
 * }
 * ```
 */
export function isTimeRangeDateRange(range: DateRange): range is TimeRange {
	return typeof range === "object" && "start" in range && "end" in range;
}

// ============================================================
// NonEmptyArray - 最低1要素を保証する配列型
// ============================================================

/**
 * 最低1つの要素を持つことが保証された配列型
 *
 * タプル型を使用して、最初の要素が必須であることをコンパイル時に強制します。
 *
 * @template T - 配列要素の型
 *
 * @example
 * ```typescript
 * // 正常: 1つ以上の要素がある
 * const valid: NonEmptyArray<number> = [1, 2, 3];
 *
 * // コンパイルエラー: 空配列は代入できない
 * const invalid: NonEmptyArray<number> = []; // Error!
 * ```
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * 配列がNonEmptyArrayかどうかを判定する型ガード
 *
 * @template T - 配列要素の型
 * @param array - 判定対象の配列
 * @returns 配列が空でない場合true
 *
 * @example
 * ```typescript
 * const items = getUserItems();
 * if (isNonEmptyArray(items)) {
 *   // items は NonEmptyArray<Item> として扱える
 *   const first = items[0]; // 安全にアクセス可能
 * }
 * ```
 */
export function isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
	return array.length > 0;
}

/**
 * NonEmptyArrayの先頭要素を取得します
 *
 * NonEmptyArray型であることが保証されているため、
 * undefinedチェックなしに先頭要素にアクセスできます。
 *
 * @template T - 配列要素の型
 * @param array - 先頭要素を取得する配列
 * @returns 配列の先頭要素
 *
 * @example
 * ```typescript
 * const items: NonEmptyArray<string> = ['a', 'b', 'c'];
 * const first = head(items); // 'a' (string型、undefinedにならない)
 * ```
 */
export function head<T>(array: NonEmptyArray<T>): T {
	return array[0];
}

/**
 * NonEmptyArrayの最後の要素を取得します
 *
 * @template T - 配列要素の型
 * @param array - 最後の要素を取得する配列
 * @returns 配列の最後の要素
 *
 * @example
 * ```typescript
 * const items: NonEmptyArray<string> = ['a', 'b', 'c'];
 * const lastItem = last(items); // 'c'
 * ```
 */
export function last<T>(array: NonEmptyArray<T>): T {
	return array[array.length - 1];
}
