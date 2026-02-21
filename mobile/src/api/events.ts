import type { EventsApiResponse } from "@miipa/shared";
import { apiFetch } from "./client";

/**
 * 今日のイベントを取得
 *
 * @param force - true の場合、バックエンドキャッシュをバイパスして再取得
 */
export function fetchTodayEvents(
	force = false,
): Promise<EventsApiResponse | null> {
	const params = force ? "?range=today&force=true" : "?range=today";
	return apiFetch<EventsApiResponse>(`/events${params}`);
}

/**
 * 今週のイベントを取得
 *
 * @param force - true の場合、バックエンドキャッシュをバイパスして再取得
 */
export function fetchWeekEvents(
	force = false,
): Promise<EventsApiResponse | null> {
	const params = force ? "?range=week&force=true" : "?range=week";
	return apiFetch<EventsApiResponse>(`/events${params}`);
}

/**
 * 指定月のイベントを取得
 *
 * @param year - 年
 * @param month - 月（1〜12）
 * @param force - true の場合、バックエンドキャッシュをバイパスして再取得
 */
export function fetchMonthEvents(
	year: number,
	month: number,
	force = false,
): Promise<EventsApiResponse | null> {
	const forceParam = force ? "&force=true" : "";
	return apiFetch<EventsApiResponse>(
		`/events?range=month&year=${year}&month=${month}${forceParam}`,
	);
}
