"use client";

/**
 * カレンダー一覧管理フック
 *
 * カレンダー一覧の取得とトグル操作を提供します。
 *
 * @module hooks/useCalendars
 *
 * @example
 * ```tsx
 * const { calendars, isLoading, error, refetch, toggleCalendar } = useCalendars();
 *
 * // カレンダー一覧を表示
 * calendars.map(cal => <CalendarCard key={cal.id} calendar={cal} />);
 *
 * // 有効/無効をトグル
 * toggleCalendar('google-work', false);
 * ```
 */

import { useCallback, useEffect, useState } from "react";
import type { CalendarConfig } from "@/lib/config/types";

/**
 * APIエラーレスポンスの型定義
 */
interface ApiError {
	code: string;
	message: string;
}

/**
 * カレンダー一覧APIレスポンスの型定義
 */
interface CalendarsResponse {
	calendars: CalendarConfig[];
	error?: ApiError;
}

/**
 * useCalendars フックの戻り値型
 */
export interface UseCalendarsResult {
	/** カレンダー一覧 */
	calendars: CalendarConfig[];
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー情報 */
	error: string | null;
	/** カレンダー一覧を再取得 */
	refetch: () => Promise<void>;
	/** カレンダーの有効/無効をトグル */
	toggleCalendar: (id: string, enabled: boolean) => Promise<void>;
}

/**
 * カレンダー一覧管理フック
 *
 * マウント時にカレンダー一覧を取得し、トグル操作後に再取得を行います。
 *
 * @returns カレンダー一覧と操作関数
 */
export function useCalendars(): UseCalendarsResult {
	const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * カレンダー一覧を取得する
	 */
	const fetchCalendars = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/calendars");
			const data: CalendarsResponse = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error?.message ?? "カレンダーの取得に失敗しました",
				);
			}

			setCalendars(data.calendars);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "カレンダーの取得に失敗しました";
			setError(message);
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * カレンダーの有効/無効をトグルする
	 *
	 * 現在はPATCH APIが未実装のため、refetchのみ行う。
	 * PATCH API実装後は enabled 状態を更新する。
	 *
	 * @param _id - カレンダーID（将来のPATCH API用）
	 * @param _enabled - 新しい有効状態（将来のPATCH API用）
	 */
	const toggleCalendar = useCallback(
		async (_id: string, _enabled: boolean) => {
			// TODO: PATCH /api/calendars/:id が実装されたら更新APIを呼び出す
			// 現時点では再取得のみ
			await fetchCalendars();
		},
		[fetchCalendars],
	);

	// マウント時にカレンダー一覧を取得
	useEffect(() => {
		fetchCalendars();
	}, [fetchCalendars]);

	return {
		calendars,
		isLoading,
		error,
		refetch: fetchCalendars,
		toggleCalendar,
	};
}
