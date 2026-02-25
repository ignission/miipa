/**
 * ブリーフィングデータ構築モジュール
 *
 * カレンダーイベント配列と現在時刻から、今日のブリーフィングデータを
 * 構築する純粋関数を提供します。副作用を持たず、テスト容易性が高い設計です。
 *
 * @module lib/application/briefing/build-briefing
 */

import type { CalendarEvent } from "@/lib/domain/calendar/entities/event";
import { sortEventsByStartTime } from "@/lib/domain/calendar/entities/event";
import { calculateFreeSlots } from "@/lib/domain/calendar/free-slots";
import { isSome } from "@/lib/domain/shared/option";

// ============================================================
// 型定義
// ============================================================

/** ブリーフィングデータ（greeting を除く構造化データ） */
export interface BriefingData {
	/** ISO日付文字列 */
	readonly date: string;
	/** 今日のイベント総数 */
	readonly eventCount: number;
	/** 次の予定 */
	readonly nextEvent: {
		readonly title: string;
		readonly startTime: string;
		readonly endTime: string;
		readonly location: string | null;
		readonly minutesUntil: number;
	} | null;
	/** 直近2時間以内に開始する重要イベント（最大3件） */
	readonly importantEvents: ReadonlyArray<{
		readonly title: string;
		readonly startTime: string;
		readonly endTime: string;
		readonly location: string | null;
	}>;
	/** 営業時間内の空き時間合計（分） */
	readonly freeTimeMinutes: number;
	/** 終日イベント一覧 */
	readonly allDayEvents: ReadonlyArray<{ readonly title: string }>;
}

// ============================================================
// 定数
// ============================================================

/** 重要イベントの最大件数 */
const MAX_IMPORTANT_EVENTS = 3;

/** 重要イベントの対象時間幅（ミリ秒）: 2時間 */
const IMPORTANT_WINDOW_MS = 2 * 60 * 60 * 1000;

/** JSTのオフセット（ミリ秒） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ============================================================
// メイン関数
// ============================================================

/**
 * カレンダーイベントからブリーフィングデータを構築
 *
 * 純粋関数として設計されており、同一入力に対して常に同一出力を返します。
 * 時刻はすべてJST基準で計算されます。
 *
 * @param events - 今日のカレンダーイベント配列
 * @param now - 現在時刻（テスト時に注入可能）
 * @returns 構造化されたブリーフィングデータ
 */
export function buildBriefing(
	events: CalendarEvent[],
	now: Date = new Date(),
): BriefingData {
	// JSTでの今日の日付文字列を生成
	const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
	const dateStr = `${jstNow.getUTCFullYear()}-${pad2(jstNow.getUTCMonth() + 1)}-${pad2(jstNow.getUTCDate())}`;

	// 終日イベントと時間指定イベントを分離
	const allDayEvents = events.filter((e) => e.isAllDay);
	const timedEvents = sortEventsByStartTime(events.filter((e) => !e.isAllDay));

	// 次の予定: 現在時刻より後に開始する最初の時間指定イベント
	const upcomingEvents = timedEvents.filter(
		(e) => e.startTime.getTime() > now.getTime(),
	);
	const nextEventRaw = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
	const nextEvent = nextEventRaw
		? {
				title: nextEventRaw.title,
				startTime: nextEventRaw.startTime.toISOString(),
				endTime: nextEventRaw.endTime.toISOString(),
				location: isSome(nextEventRaw.location)
					? nextEventRaw.location.value
					: null,
				minutesUntil: Math.round(
					(nextEventRaw.startTime.getTime() - now.getTime()) / (1000 * 60),
				),
			}
		: null;

	// 重要イベント: 現在時刻から2時間以内に開始する時間指定イベント（最大3件）
	const importantWindowEnd = now.getTime() + IMPORTANT_WINDOW_MS;
	const importantEvents = upcomingEvents
		.filter((e) => e.startTime.getTime() <= importantWindowEnd)
		.slice(0, MAX_IMPORTANT_EVENTS)
		.map((e) => ({
			title: e.title,
			startTime: e.startTime.toISOString(),
			endTime: e.endTime.toISOString(),
			location: isSome(e.location) ? e.location.value : null,
		}));

	// 営業時間内の空き時間を計算
	const freeSlots = calculateFreeSlots(events, { date: now });
	const freeTimeMinutes = freeSlots.reduce(
		(total, slot) => total + slot.durationMinutes,
		0,
	);

	return {
		date: dateStr,
		eventCount: events.length,
		nextEvent,
		importantEvents,
		freeTimeMinutes: Math.round(freeTimeMinutes),
		allDayEvents: allDayEvents.map((e) => ({ title: e.title })),
	};
}

// ============================================================
// ヘルパー
// ============================================================

/**
 * 数値を2桁ゼロ埋めにフォーマット
 */
function pad2(n: number): string {
	return n.toString().padStart(2, "0");
}
