import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCalendars, syncCalendars } from "../api/calendars";

/**
 * カレンダー一覧取得フック
 */
export function useCalendars() {
	return useQuery({
		queryKey: ["calendars"],
		queryFn: async () => {
			const data = await fetchCalendars();
			return data.calendars;
		},
	});
}

/**
 * カレンダー同期フック
 */
export function useSyncCalendars() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: syncCalendars,
		onSuccess: () => {
			// 同期後にイベントとカレンダーを再取得
			queryClient.invalidateQueries({ queryKey: ["events"] });
			queryClient.invalidateQueries({ queryKey: ["calendars"] });
		},
	});
}
