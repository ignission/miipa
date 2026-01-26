"use client";

/**
 * iCal カレンダー追加フック
 *
 * iCal URL からカレンダーを追加するフックを提供します。
 *
 * @module hooks/useAddICalCalendar
 *
 * @example
 * ```tsx
 * const { addCalendar, isLoading, error } = useAddICalCalendar();
 *
 * const handleSubmit = async (url: string, name?: string) => {
 *   const result = await addCalendar(url, name);
 *   if (result) {
 *     console.log('追加されたカレンダー:', result);
 *   }
 * };
 * ```
 */

import { useCallback, useState } from "react";
import type { CalendarConfig } from "@/lib/config/types";

/**
 * APIエラーレスポンスの型定義
 */
interface ApiError {
	code: string;
	message: string;
}

/**
 * iCal追加APIレスポンスの型定義
 */
interface AddICalResponse {
	calendar?: CalendarConfig;
	error?: ApiError;
}

/**
 * useAddICalCalendar フックの戻り値型
 */
export interface UseAddICalCalendarResult {
	/** iCalカレンダーを追加する */
	addCalendar: (url: string, name?: string) => Promise<CalendarConfig | null>;
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー情報 */
	error: string | null;
}

/**
 * iCal カレンダー追加フック
 *
 * POST /api/calendars/ical を呼び出し、iCalカレンダーを追加します。
 *
 * @returns カレンダー追加関数と状態
 */
export function useAddICalCalendar(): UseAddICalCalendarResult {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * iCal カレンダーを追加する
	 *
	 * @param url - iCal URL
	 * @param name - カレンダー名（オプション）
	 * @returns 追加されたカレンダー設定、失敗時はnull
	 */
	const addCalendar = useCallback(
		async (url: string, name?: string): Promise<CalendarConfig | null> => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/calendars/ical", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ url, name }),
				});
				const data: AddICalResponse = await response.json();

				if (!response.ok) {
					throw new Error(
						data.error?.message ?? "iCalカレンダーの追加に失敗しました",
					);
				}

				if (!data.calendar) {
					throw new Error("カレンダー情報が取得できませんでした");
				}

				return data.calendar;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "iCalカレンダーの追加に失敗しました";
				setError(message);
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[],
	);

	return {
		addCalendar,
		isLoading,
		error,
	};
}
