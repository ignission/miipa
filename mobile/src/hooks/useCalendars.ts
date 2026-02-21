import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Calendar } from "../api/calendars";
import {
	addICalCalendar,
	deleteCalendar,
	fetchCalendars,
	startGoogleAuth,
	syncCalendars,
	toggleCalendar,
} from "../api/calendars";
import { fetchTodayEvents, fetchWeekEvents } from "../api/events";
import { toUIEvent } from "./useEvents";

/**
 * カレンダー一覧取得フック
 *
 * カレンダー一覧の取得と CRUD 操作を提供します。
 * Web の useCalendars / useAddGoogleCalendar / useAddICalCalendar /
 * useDeleteCalendar を統合したフックです。
 */
export function useCalendars() {
	const queryClient = useQueryClient();

	/** カレンダー一覧クエリ */
	const query = useQuery({
		queryKey: ["calendars"],
		queryFn: async () => {
			const data = await fetchCalendars();
			return data?.calendars ?? [];
		},
	});

	/** カレンダー有効/無効の切り替え */
	const toggleMutation = useMutation({
		mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
			toggleCalendar(id, enabled),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendars"] });
		},
	});

	/** カレンダー削除 */
	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteCalendar(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendars"] });
			queryClient.invalidateQueries({ queryKey: ["events"] });
		},
	});

	/** Google OAuth認証開始 */
	const googleAuthMutation = useMutation({
		mutationFn: (loginHint?: string) => startGoogleAuth(loginHint),
	});

	/** iCalカレンダー追加 */
	const addICalMutation = useMutation({
		mutationFn: ({ url, name }: { url: string; name?: string }) =>
			addICalCalendar(url, name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["calendars"] });
		},
	});

	return {
		/** カレンダー一覧 */
		calendars: query.data ?? ([] as Calendar[]),
		/** ローディング状態 */
		isLoading: query.isLoading,
		/** エラー情報 */
		error: query.error,
		/** カレンダー一覧を再取得 */
		refetch: query.refetch,
		/** カレンダーの有効/無効をトグル */
		toggleCalendar: toggleMutation.mutateAsync,
		/** トグル中かどうか */
		isToggling: toggleMutation.isPending,
		/** カレンダーを削除 */
		deleteCalendar: deleteMutation.mutateAsync,
		/** 削除中かどうか */
		isDeleting: deleteMutation.isPending,
		/** Google OAuth認証を開始 */
		startGoogleAuth: googleAuthMutation.mutateAsync,
		/** Google認証処理中かどうか */
		isStartingGoogleAuth: googleAuthMutation.isPending,
		/** iCalカレンダーを追加 */
		addICalCalendar: addICalMutation.mutateAsync,
		/** iCal追加処理中かどうか */
		isAddingICal: addICalMutation.isPending,
	};
}

/**
 * カレンダー同期フック
 *
 * 全カレンダーの同期を実行し、同期後にイベントとカレンダーを再取得します。
 */
export function useSyncCalendars() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: syncCalendars,
		onSuccess: async () => {
			// 同期後にカレンダー一覧を再取得
			await queryClient.invalidateQueries({ queryKey: ["calendars"] });
			// 同期後は強制リフレッシュでイベントを再取得（バックエンドキャッシュをバイパス）
			await queryClient.fetchQuery({
				queryKey: ["events", "today"],
				queryFn: async () => {
					const data = await fetchTodayEvents(true);
					if (!data) return { events: [], lastSync: null };
					return {
						events: data.events.map(toUIEvent),
						lastSync: data.lastSync ? new Date(data.lastSync) : null,
					};
				},
			});
			await queryClient.fetchQuery({
				queryKey: ["events", "week"],
				queryFn: async () => {
					const data = await fetchWeekEvents(true);
					if (!data) return { events: [], lastSync: null };
					return {
						events: data.events.map(toUIEvent),
						lastSync: data.lastSync ? new Date(data.lastSync) : null,
					};
				},
			});
		},
	});
}
