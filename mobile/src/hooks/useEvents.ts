import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventsApiResponse, EventResponse } from "@miipa/shared";
import { fetchTodayEvents, fetchWeekEvents } from "../api/events";

type EventRange = "today" | "week";

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
		source: event.source,
	};
}

/**
 * イベント取得フック（TanStack Query）
 */
export function useEvents(range: EventRange) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: ["events", range],
		queryFn: async (): Promise<{
			events: UICalendarEvent[];
			lastSync: Date | null;
		}> => {
			const data: EventsApiResponse =
				range === "week"
					? await fetchWeekEvents()
					: await fetchTodayEvents();

			return {
				events: data.events.map(toUIEvent),
				lastSync: data.lastSync ? new Date(data.lastSync) : null,
			};
		},
	});

	const refresh = async () => {
		await queryClient.invalidateQueries({ queryKey: ["events", range] });
	};

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
