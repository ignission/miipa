/**
 * カレンダーイベントエンティティ
 *
 * カレンダーイベントを表現するエンティティとファクトリ関数を提供します。
 * イミュータブルな設計で、Option型を使用してnull安全を実現しています。
 *
 * @module lib/domain/calendar/entities/event
 */

import type { Option } from "@/lib/domain/shared/option";
import { none, some } from "@/lib/domain/shared/option";
import type { CalendarId, EventId } from "@/lib/domain/shared/types";

// ============================================================
// 型定義
// ============================================================

/**
 * カレンダーソース情報
 *
 * イベントの取得元カレンダーの情報を保持します。
 * Google CalendarまたはiCal URLのいずれかを表します。
 */
export interface CalendarSource {
	/** ソースの種類 */
	readonly type: "google" | "ical";
	/** カレンダーの表示名 */
	readonly calendarName: string;
	/** Googleアカウントのメールアドレス（Google Calendar用） */
	readonly accountEmail?: string;
}

/**
 * カレンダーイベントエンティティ
 *
 * カレンダー上の予定を表現する不変オブジェクトです。
 * すべてのプロパティはreadonlyで、作成後は変更できません。
 *
 * @example
 * ```typescript
 * const event = createCalendarEvent({
 *   id: createEventId('event-123'),
 *   calendarId: createCalendarId('cal-456'),
 *   title: '定例ミーティング',
 *   startTime: new Date('2026-01-26T10:00:00'),
 *   endTime: new Date('2026-01-26T11:00:00'),
 *   source: { type: 'google', calendarName: 'メインカレンダー' },
 * });
 * ```
 */
export interface CalendarEvent {
	/** イベントの一意識別子 */
	readonly id: EventId;
	/** 所属するカレンダーの識別子 */
	readonly calendarId: CalendarId;
	/** イベントのタイトル */
	readonly title: string;
	/** 開始日時 */
	readonly startTime: Date;
	/** 終了日時 */
	readonly endTime: Date;
	/** 終日イベントかどうか */
	readonly isAllDay: boolean;
	/** 場所（存在しない場合はNone） */
	readonly location: Option<string>;
	/** 説明（存在しない場合はNone） */
	readonly description: Option<string>;
	/** イベントの取得元情報 */
	readonly source: CalendarSource;
}

// ============================================================
// ファクトリ関数
// ============================================================

/**
 * CalendarEventファクトリ関数のパラメータ
 *
 * イベント作成時に必要な情報を定義します。
 * オプショナルなフィールドにはデフォルト値が適用されます。
 */
export interface CreateCalendarEventParams {
	/** イベントの一意識別子 */
	id: EventId;
	/** 所属するカレンダーの識別子 */
	calendarId: CalendarId;
	/** イベントのタイトル */
	title: string;
	/** 開始日時 */
	startTime: Date;
	/** 終了日時 */
	endTime: Date;
	/** 終日イベントかどうか（省略時: false） */
	isAllDay?: boolean;
	/** 場所（省略可能） */
	location?: string;
	/** 説明（省略可能） */
	description?: string;
	/** イベントの取得元情報 */
	source: CalendarSource;
}

/**
 * CalendarEventを生成
 *
 * パラメータからイミュータブルなCalendarEventエンティティを作成します。
 * オプショナルな値はOption型にラップされます。
 *
 * @param params - イベント作成パラメータ
 * @returns 不変のCalendarEventエンティティ
 *
 * @example
 * ```typescript
 * const event = createCalendarEvent({
 *   id: createEventId('event-123'),
 *   calendarId: createCalendarId('cal-456'),
 *   title: '打ち合わせ',
 *   startTime: new Date('2026-01-26T14:00:00'),
 *   endTime: new Date('2026-01-26T15:00:00'),
 *   location: '会議室A',
 *   source: { type: 'google', calendarName: '仕事' },
 * });
 *
 * // location は Some<string> になる
 * if (isSome(event.location)) {
 *   console.log(event.location.value); // '会議室A'
 * }
 * ```
 */
export function createCalendarEvent(
	params: CreateCalendarEventParams,
): CalendarEvent {
	return {
		id: params.id,
		calendarId: params.calendarId,
		title: params.title,
		startTime: params.startTime,
		endTime: params.endTime,
		isAllDay: params.isAllDay ?? false,
		location: params.location ? some(params.location) : none(),
		description: params.description ? some(params.description) : none(),
		source: params.source,
	};
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * イベントを開始時刻でソート
 *
 * 新しい配列を返し、元の配列は変更しません。
 * 開始時刻が早い順（昇順）にソートされます。
 *
 * @param events - ソート対象のイベント配列
 * @returns 開始時刻順にソートされた新しい配列
 *
 * @example
 * ```typescript
 * const events = [eventAt10AM, eventAt9AM, eventAt11AM];
 * const sorted = sortEventsByStartTime(events);
 * // sorted = [eventAt9AM, eventAt10AM, eventAt11AM]
 * // events は変更されない
 * ```
 */
export function sortEventsByStartTime(
	events: CalendarEvent[],
): CalendarEvent[] {
	return [...events].sort(
		(a, b) => a.startTime.getTime() - b.startTime.getTime(),
	);
}

/**
 * 終日イベントかどうかを判定
 *
 * @param event - 判定対象のイベント
 * @returns 終日イベントの場合はtrue
 *
 * @example
 * ```typescript
 * if (isAllDayEvent(event)) {
 *   console.log('終日の予定です');
 * }
 * ```
 */
export function isAllDayEvent(event: CalendarEvent): boolean {
	return event.isAllDay;
}

/**
 * イベントの時間範囲が指定した日付と重複するかを判定
 *
 * @param event - 判定対象のイベント
 * @param date - 判定する日付
 * @returns イベントが指定日と重複する場合はtrue
 *
 * @example
 * ```typescript
 * const today = new Date('2026-01-26');
 * const todayEvents = events.filter(e => isEventOnDate(e, today));
 * ```
 */
export function isEventOnDate(event: CalendarEvent, date: Date): boolean {
	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);

	const dayEnd = new Date(date);
	dayEnd.setHours(23, 59, 59, 999);

	return event.startTime <= dayEnd && event.endTime >= dayStart;
}

/**
 * イベントの継続時間（ミリ秒）を取得
 *
 * @param event - 対象のイベント
 * @returns イベントの継続時間（ミリ秒）
 *
 * @example
 * ```typescript
 * const durationMs = getEventDuration(event);
 * const durationMinutes = durationMs / (1000 * 60);
 * console.log(`${durationMinutes}分の予定です`);
 * ```
 */
export function getEventDuration(event: CalendarEvent): number {
	return event.endTime.getTime() - event.startTime.getTime();
}

/**
 * イベントの継続時間（分）を取得
 *
 * @param event - 対象のイベント
 * @returns イベントの継続時間（分）
 *
 * @example
 * ```typescript
 * const minutes = getEventDurationInMinutes(event);
 * console.log(`${minutes}分の予定です`);
 * ```
 */
export function getEventDurationInMinutes(event: CalendarEvent): number {
	return getEventDuration(event) / (1000 * 60);
}
