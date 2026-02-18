import { apiFetch } from "./client";

// ============================================================
// 型定義
// ============================================================

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

/** 同期エラーカレンダー情報 */
interface ErrorCalendar {
	id: string;
	name: string;
	error: string;
}

/** 同期レスポンス */
export interface SyncResponse {
	success: boolean;
	syncedAt?: string;
	successCount?: number;
	errorCalendars?: ErrorCalendar[];
	error?: string;
}

/** Google認証レスポンス */
interface GoogleAuthResponse {
	authUrl?: string;
	error?: {
		code: string;
		message: string;
	};
}

/** iCal追加レスポンス */
interface AddICalResponse {
	calendar?: Calendar;
	error?: {
		code: string;
		message: string;
	};
}

/** カレンダートグルレスポンス */
interface ToggleCalendarResponse {
	calendar: Calendar;
}

// ============================================================
// API関数
// ============================================================

/**
 * カレンダー一覧を取得
 */
export function fetchCalendars(): Promise<CalendarsApiResponse> {
	return apiFetch<CalendarsApiResponse>("/api/calendars");
}

/**
 * カレンダー同期を実行
 */
export function syncCalendars(): Promise<SyncResponse> {
	return apiFetch<SyncResponse>("/api/calendars/sync", {
		method: "POST",
	});
}

/**
 * カレンダーの有効/無効を切り替え
 *
 * @param id - カレンダーID
 * @param enabled - 新しい有効状態
 */
export function toggleCalendar(
	id: string,
	enabled: boolean,
): Promise<ToggleCalendarResponse> {
	return apiFetch<ToggleCalendarResponse>(
		`/api/calendars/${encodeURIComponent(id)}`,
		{
			method: "PATCH",
			body: JSON.stringify({ enabled }),
		},
	);
}

/**
 * カレンダーを削除
 *
 * @param id - 削除するカレンダーのID
 */
export function deleteCalendar(id: string): Promise<null> {
	return apiFetch<null>(`/api/calendars/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
}

/**
 * Google OAuth認証を開始
 *
 * 認証URLを取得し、そのURLにリダイレクトします。
 *
 * @param loginHint - ログインヒント（メールアドレス）
 */
export function startGoogleAuth(
	loginHint?: string,
): Promise<GoogleAuthResponse> {
	return apiFetch<GoogleAuthResponse>("/api/calendars/google", {
		method: "POST",
		body: JSON.stringify({ loginHint }),
	});
}

/**
 * iCalカレンダーを追加
 *
 * @param url - iCal URL
 * @param name - カレンダー名（オプション）
 */
export function addICalCalendar(
	url: string,
	name?: string,
): Promise<AddICalResponse> {
	return apiFetch<AddICalResponse>("/api/calendars/ical", {
		method: "POST",
		body: JSON.stringify({ url, name }),
	});
}
