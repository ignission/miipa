import type { EventResponse } from "@miipa/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchTodayEvents, fetchWeekEvents } from "../api/events";

/** イベント取得範囲 */
export type EventRange = "today" | "week";

/**
 * UI表示用のカレンダーイベント型
 */
export interface UICalendarEvent {
	id: string;
	title: string;
	startTime: Date;
	endTime: Date;
	isAllDay: boolean;
	location: string | null;
	description: string | null;
	calendarId: string;
	color?: string;
	source: {
		type: "google" | "ical";
		calendarName: string;
		accountEmail?: string;
	};
}

/**
 * シリアライズされたイベントをUI用に変換
 */
function toUIEvent(event: EventResponse): UICalendarEvent {
	return {
		id: event.id,
		title: event.title,
		startTime: new Date(event.startTime),
		endTime: new Date(event.endTime),
		isAllDay: event.isAllDay,
		location: event.location,
		description: event.description,
		calendarId: "",
		source: {
			type: event.source.type,
			calendarName: event.source.calendarName,
			accountEmail: event.source.accountEmail ?? undefined,
		},
	};
}

/**
 * イベント取得フック（TanStack Query）
 *
 * 指定された範囲（今日/今週）のイベントをAPIから取得し、
 * ローディング状態、エラー状態、再取得機能を提供します。
 * 同期状態（lastSync）もレスポンスから取得して管理します。
 *
 * @param range - 取得する範囲（'today' | 'week'）
 */
export function useEvents(range: EventRange) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ["events", range],
		queryFn: async (): Promise<{
			events: UICalendarEvent[];
			lastSync: Date | null;
		}> => {
			const data =
				range === "week" ? await fetchWeekEvents() : await fetchTodayEvents();

			if (!data) {
				return { events: [], lastSync: null };
			}

			return {
				events: data.events.map(toUIEvent),
				lastSync: data.lastSync ? new Date(data.lastSync) : null,
			};
		},
	});

	/** イベントを手動で再取得 */
	const refresh = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: ["events", range] });
	}, [queryClient, range]);

	return {
		/** イベント一覧 */
		events: query.data?.events ?? [],
		/** 初回ローディング中 */
		isLoading: query.isLoading,
		/** バックグラウンドでの再取得中 */
		isRefreshing: query.isFetching && !query.isLoading,
		/** エラー情報 */
		error: query.error,
		/** 最終同期日時 */
		lastSync: query.data?.lastSync ?? null,
		/** イベントを手動で再取得 */
		refresh,
		/** TanStack Query の refetch */
		refetch: query.refetch,
	};
}
