import type { BriefingResponse } from "@miipa/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchBriefing } from "../api/briefing";

/**
 * ブリーフィング取得フック（TanStack Query）
 *
 * 今日の予定サマリーとAI生成の挨拶文をAPIから取得し、
 * ローディング状態、エラー状態、再取得機能を提供します。
 */
export function useBriefing() {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ["briefing"],
		queryFn: async (): Promise<BriefingResponse | null> => {
			return await fetchBriefing();
		},
		staleTime: 5 * 60 * 1000,
		retry: 2,
	});

	/** ブリーフィングを手動で再取得 */
	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ["briefing"] });
	}, [queryClient]);

	return {
		/** ブリーフィングデータ */
		briefing: query.data ?? null,
		/** 初回ローディング中 */
		isLoading: query.isLoading,
		/** エラー情報 */
		error: query.error,
		/** ブリーフィングを手動で再取得 */
		refresh,
	};
}
