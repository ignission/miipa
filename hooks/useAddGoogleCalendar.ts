"use client";

/**
 * Google カレンダー追加フック
 *
 * Google OAuth 認証フローを開始するフックを提供します。
 *
 * @module hooks/useAddGoogleCalendar
 *
 * @example
 * ```tsx
 * const { startAuth, isLoading, error } = useAddGoogleCalendar();
 *
 * <button onClick={startAuth} disabled={isLoading}>
 *   Googleカレンダーを追加
 * </button>
 * ```
 */

import { useCallback, useState } from "react";

/**
 * APIエラーレスポンスの型定義
 */
interface ApiError {
	code: string;
	message: string;
}

/**
 * Google OAuth APIレスポンスの型定義
 */
interface GoogleAuthResponse {
	authUrl?: string;
	error?: ApiError;
}

/**
 * useAddGoogleCalendar フックの戻り値型
 */
export interface UseAddGoogleCalendarResult {
	/** OAuth認証を開始する */
	startAuth: () => Promise<void>;
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー情報 */
	error: string | null;
}

/**
 * Google カレンダー追加フック
 *
 * POST /api/calendars/google を呼び出し、
 * 返された authUrl にリダイレクトして OAuth 認証を開始します。
 *
 * @returns 認証開始関数と状態
 */
export function useAddGoogleCalendar(): UseAddGoogleCalendarResult {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Google OAuth 認証を開始する
	 *
	 * APIから認証URLを取得し、そのURLにリダイレクトします。
	 */
	const startAuth = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/calendars/google", {
				method: "POST",
			});
			const data: GoogleAuthResponse = await response.json();

			if (!response.ok) {
				throw new Error(data.error?.message ?? "認証URLの取得に失敗しました");
			}

			if (!data.authUrl) {
				throw new Error("認証URLが取得できませんでした");
			}

			// 認証URLにリダイレクト
			window.location.href = data.authUrl;
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Google認証の開始に失敗しました";
			setError(message);
			setIsLoading(false);
		}
		// リダイレクト時は isLoading を false にしない（ページ遷移するため）
	}, []);

	return {
		startAuth,
		isLoading,
		error,
	};
}
