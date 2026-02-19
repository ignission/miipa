import {
	keepPreviousData,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchMonthEvents } from "../api/events";
import { type UICalendarEvent, toUIEvent } from "./useEvents";

/**
 * 月イベント取得フック
 *
 * 指定された年月のイベントをAPIから取得し、
 * ローディング状態、エラー状態、再取得機能を提供します。
 * placeholderDataで月切り替え時のUXを向上させます。
 *
 * @param year - 年
 * @param month - 月（1〜12）
 */
export function useMonthEvents(year: number, month: number) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ["events", "month", year, month],
		queryFn: async (): Promise<{
			events: UICalendarEvent[];
			lastSync: Date | null;
		}> => {
			const data = await fetchMonthEvents(year, month);

			if (!data) {
				return { events: [], lastSync: null };
			}

			return {
				events: data.events.map(toUIEvent),
				lastSync: data.lastSync ? new Date(data.lastSync) : null,
			};
		},
		placeholderData: keepPreviousData,
	});

	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({
			queryKey: ["events", "month", year, month],
		});
	}, [queryClient, year, month]);

	return {
		events: query.data?.events ?? [],
		isLoading: query.isLoading,
		isRefreshing: query.isFetching && !query.isLoading,
		error: query.error,
		lastSync: query.data?.lastSync ?? null,
		refresh,
		refetch: query.refetch,
	};
}
