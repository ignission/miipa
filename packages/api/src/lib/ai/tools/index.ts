/**
 * AIツールレジストリ
 *
 * AIエージェントが使用可能なツールの定義と実行を管理します。
 *
 * @module lib/ai/tools
 */

import type { ToolDefinition } from "@/lib/ai/providers/types";
import type { CalendarContext } from "@/lib/context/calendar-context";
import {
	executeFindFreeSlots,
	findFreeSlotsDefinition,
} from "./find-free-slots";
import {
	executeGetCalendarEvents,
	getCalendarEventsDefinition,
} from "./get-calendar-events";

// ============================================================
// 型定義
// ============================================================

/** ツール実行ハンドラ */
type ToolHandler = (
	ctx: CalendarContext,
	args: Record<string, unknown>,
) => Promise<string>;

/** AIツール群のインターフェース */
export interface MiipaTools {
	readonly definitions: ToolDefinition[];
	readonly execute: (
		toolName: string,
		args: Record<string, unknown>,
	) => Promise<string>;
}

// ============================================================
// ファクトリ関数
// ============================================================

/** CalendarContextからツール群を生成 */
export function createMiipaTools(ctx: CalendarContext): MiipaTools {
	const toolMap = new Map<string, ToolHandler>();
	toolMap.set("get_calendar_events", executeGetCalendarEvents);
	toolMap.set("find_free_slots", executeFindFreeSlots);

	return {
		definitions: [getCalendarEventsDefinition, findFreeSlotsDefinition],
		execute: async (toolName: string, args: Record<string, unknown>) => {
			const handler = toolMap.get(toolName);
			if (!handler) return `エラー: 不明なツール「${toolName}」`;
			return handler(ctx, args);
		},
	};
}
