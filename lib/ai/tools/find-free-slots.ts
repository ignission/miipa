/**
 * 空き時間検索ツール
 *
 * AIが指定日の空き時間を検索するためのツール定義と実行関数を提供します。
 *
 * @module lib/ai/tools/find-free-slots
 */

import type { ToolDefinition } from "@/lib/ai/providers/types";
import { getEventsForRange } from "@/lib/application/calendar/get-events";
import type { CalendarContext } from "@/lib/context/calendar-context";
import { createTimeRange } from "@/lib/domain/calendar";
import { calculateFreeSlots } from "@/lib/domain/calendar/free-slots";
import { isOk } from "@/lib/domain/shared/result";

// ============================================================
// 定数
// ============================================================

/** JSTのオフセット（ミリ秒） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ============================================================
// ツール定義
// ============================================================

export const findFreeSlotsDefinition: ToolDefinition = {
	name: "find_free_slots",
	description:
		"指定した日の空き時間を検索します。営業時間内で予定が入っていない時間帯を返します。",
	inputSchema: {
		type: "object",
		properties: {
			date: {
				type: "string",
				description: "空き時間を検索する日付（ISO 8601形式、例: 2026-02-15）",
			},
			minDurationMinutes: {
				type: "number",
				description:
					"最小スロット長（分）。この時間以上の空きのみ返します。デフォルト: 30",
			},
			workingHoursStart: {
				type: "number",
				description: "営業開始時刻（時）。デフォルト: 9",
			},
			workingHoursEnd: {
				type: "number",
				description: "営業終了時刻（時）。デフォルト: 18",
			},
		},
		required: ["date"],
	},
};

// ============================================================
// 実行関数
// ============================================================

export async function executeFindFreeSlots(
	ctx: CalendarContext,
	args: Record<string, unknown>,
): Promise<string> {
	const dateStr = args.date as string;
	if (!dateStr) return "エラー: dateパラメータが必要です。";

	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) {
		return "エラー: 不正な日付形式です。YYYY-MM-DD形式で指定してください。";
	}

	// その日全体の範囲で取得（JST 0:00-23:59:59.999）
	const jstDate = new Date(date.getTime() + JST_OFFSET_MS);
	const year = jstDate.getUTCFullYear();
	const month = jstDate.getUTCMonth();
	const day = jstDate.getUTCDate();
	const dayStart = new Date(
		Date.UTC(year, month, day, 0, 0, 0, 0) - JST_OFFSET_MS,
	);
	const dayEnd = new Date(
		Date.UTC(year, month, day, 23, 59, 59, 999) - JST_OFFSET_MS,
	);

	const range = createTimeRange(dayStart, dayEnd);
	const result = await getEventsForRange(ctx, range);
	if (!isOk(result)) return `エラー: ${result.error.message}`;

	const slots = calculateFreeSlots(result.value, {
		date,
		minDurationMinutes: args.minDurationMinutes as number | undefined,
		workingHoursStart: args.workingHoursStart as number | undefined,
		workingHoursEnd: args.workingHoursEnd as number | undefined,
	});

	if (slots.length === 0) return `${dateStr}に空き時間はありません。`;

	const formatted = slots.map((slot) => {
		const start = slot.start.toLocaleString("ja-JP", {
			timeZone: "Asia/Tokyo",
			hour: "2-digit",
			minute: "2-digit",
		});
		const end = slot.end.toLocaleString("ja-JP", {
			timeZone: "Asia/Tokyo",
			hour: "2-digit",
			minute: "2-digit",
		});
		return `${start} 〜 ${end}（${slot.durationMinutes}分）`;
	});

	return `${dateStr}の空き時間（${slots.length}件）:\n${formatted.join("\n")}`;
}
