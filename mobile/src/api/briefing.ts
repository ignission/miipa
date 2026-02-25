import type { BriefingResponse } from "@miipa/shared";
import { apiFetch } from "./client";

/**
 * 今日のブリーフィングを取得
 *
 * AI生成の挨拶文と予定サマリーを返します。
 */
export function fetchBriefing(): Promise<BriefingResponse | null> {
	return apiFetch<BriefingResponse>("/briefing");
}
