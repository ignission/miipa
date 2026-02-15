/**
 * カレンダーイベント取得ツール
 *
 * AIがカレンダーの予定を取得するためのツール定義と実行関数を提供します。
 *
 * @module lib/ai/tools/get-calendar-events
 */

import type { ToolDefinition } from "@/lib/ai/providers/types";
import {
	getEventsForRange,
	getEventsForToday,
	getEventsForWeek,
} from "@/lib/application/calendar/get-events";
import type { CalendarContext } from "@/lib/context/calendar-context";
import type { CalendarEvent } from "@/lib/domain/calendar";
import { createTimeRange } from "@/lib/domain/calendar";
import { isSome } from "@/lib/domain/shared/option";
import { isOk } from "@/lib/domain/shared/result";

// ============================================================
// ツール定義
// ============================================================

export const getCalendarEventsDefinition: ToolDefinition = {
	name: "get_calendar_events",
	description:
		"ユーザーのカレンダーから予定を取得します。今日、今週、または指定した期間の予定を取得できます。",
	inputSchema: {
		type: "object",
		properties: {
			range: {
				type: "string",
				enum: ["today", "week", "custom"],
				description:
					"取得する期間。todayは今日、weekは今週、customは開始日と終了日を指定",
			},
			startDate: {
				type: "string",
				description: "custom指定時の開始日（ISO 8601形式、例: 2026-02-15）",
			},
			endDate: {
				type: "string",
				description: "custom指定時の終了日（ISO 8601形式、例: 2026-02-16）",
			},
		},
		required: ["range"],
	},
};

// ============================================================
// フォーマット関数
// ============================================================

function formatEvent(event: CalendarEvent): string {
	const start = event.startTime.toLocaleString("ja-JP", {
		timeZone: "Asia/Tokyo",
	});
	const end = event.endTime.toLocaleString("ja-JP", {
		timeZone: "Asia/Tokyo",
	});
	const location = isSome(event.location)
		? ` | 場所: ${event.location.value}`
		: "";
	const desc = isSome(event.description)
		? ` | 詳細: ${event.description.value}`
		: "";

	if (event.isAllDay) {
		return `[終日] ${event.title}${location}${desc}`;
	}
	return `${start} 〜 ${end} | ${event.title}${location}${desc}`;
}

// ============================================================
// 実行関数
// ============================================================

export async function executeGetCalendarEvents(
	ctx: CalendarContext,
	args: Record<string, unknown>,
): Promise<string> {
	const range = args.range as string;

	if (range === "today") {
		const result = await getEventsForToday(ctx);
		if (!isOk(result)) return `エラー: ${result.error.message}`;
		if (result.value.length === 0) return "今日の予定はありません。";
		return `今日の予定（${result.value.length}件）:\n${result.value.map(formatEvent).join("\n")}`;
	}

	if (range === "week") {
		const result = await getEventsForWeek(ctx);
		if (!isOk(result)) return `エラー: ${result.error.message}`;
		if (result.value.length === 0) return "今週の予定はありません。";
		return `今週の予定（${result.value.length}件）:\n${result.value.map(formatEvent).join("\n")}`;
	}

	if (range === "custom") {
		const startStr = args.startDate as string;
		const endStr = args.endDate as string;
		if (!startStr || !endStr)
			return "エラー: custom指定時はstartDateとendDateが必要です。";

		const startDate = new Date(startStr);
		if (Number.isNaN(startDate.getTime())) {
			return "エラー: 不正な開始日付形式です。YYYY-MM-DD形式で指定してください。";
		}
		const endDate = new Date(endStr);
		if (Number.isNaN(endDate.getTime())) {
			return "エラー: 不正な終了日付形式です。YYYY-MM-DD形式で指定してください。";
		}
		// 終了日の23:59:59.999に設定
		endDate.setHours(23, 59, 59, 999);

		const timeRange = createTimeRange(startDate, endDate);
		const result = await getEventsForRange(ctx, timeRange);
		if (!isOk(result)) return `エラー: ${result.error.message}`;
		if (result.value.length === 0)
			return `${startStr}〜${endStr}の予定はありません。`;
		return `${startStr}〜${endStr}の予定（${result.value.length}件）:\n${result.value.map(formatEvent).join("\n")}`;
	}

	return "エラー: rangeはtoday、week、customのいずれかを指定してください。";
}
