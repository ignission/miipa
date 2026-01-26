"use client";

/**
 * カレンダー削除フック
 *
 * カレンダーを削除するフックを提供します。
 *
 * @module hooks/useDeleteCalendar
 *
 * @example
 * ```tsx
 * const { deleteCalendar, isLoading, error } = useDeleteCalendar();
 *
 * const handleDelete = async (id: string) => {
 *   const success = await deleteCalendar(id);
 *   if (success) {
 *     console.log('削除完了');
 *   }
 * };
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
 * 削除APIエラーレスポンスの型定義
 */
interface DeleteErrorResponse {
	error?: ApiError;
}

/**
 * useDeleteCalendar フックの戻り値型
 */
export interface UseDeleteCalendarResult {
	/** カレンダーを削除する */
	deleteCalendar: (id: string) => Promise<boolean>;
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー情報 */
	error: string | null;
}

/**
 * カレンダー削除フック
 *
 * DELETE /api/calendars/:id を呼び出し、カレンダーを削除します。
 *
 * @returns カレンダー削除関数と状態
 */
export function useDeleteCalendar(): UseDeleteCalendarResult {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * カレンダーを削除する
	 *
	 * @param id - 削除するカレンダーのID
	 * @returns 削除成功時はtrue、失敗時はfalse
	 */
	const deleteCalendar = useCallback(async (id: string): Promise<boolean> => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/calendars/${encodeURIComponent(id)}`, {
				method: "DELETE",
			});

			// 204 No Content は成功
			if (response.status === 204) {
				return true;
			}

			// エラーレスポンスをパース
			const data: DeleteErrorResponse = await response.json();
			throw new Error(data.error?.message ?? "カレンダーの削除に失敗しました");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "カレンダーの削除に失敗しました";
			setError(message);
			return false;
		} finally {
			setIsLoading(false);
		}
	}, []);

	return {
		deleteCalendar,
		isLoading,
		error,
	};
}
