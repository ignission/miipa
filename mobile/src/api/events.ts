import type { EventsApiResponse } from "@miipa/shared";
import { apiFetch } from "./client";

/**
 * 今日のイベントを取得
 */
export function fetchTodayEvents(): Promise<EventsApiResponse> {
	return apiFetch<EventsApiResponse>("/api/events?range=today");
}

/**
 * 今週のイベントを取得
 */
export function fetchWeekEvents(): Promise<EventsApiResponse> {
	return apiFetch<EventsApiResponse>("/api/events?range=week");
}
