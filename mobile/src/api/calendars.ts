import { apiFetch } from "./client";

/**
 * カレンダー情報
 */
export interface Calendar {
	id: string;
	name: string;
	type: "google" | "ical";
	color: string;
	enabled: boolean;
	accountEmail?: string;
}

/**
 * カレンダー一覧レスポンス
 */
interface CalendarsApiResponse {
	calendars: Calendar[];
}

/**
 * カレンダー一覧を取得
 */
export function fetchCalendars(): Promise<CalendarsApiResponse> {
	return apiFetch<CalendarsApiResponse>("/api/calendars");
}

/**
 * カレンダー同期を実行
 */
export function syncCalendars(): Promise<{ success: boolean }> {
	return apiFetch<{ success: boolean }>("/api/calendars/sync", {
		method: "POST",
	});
}
