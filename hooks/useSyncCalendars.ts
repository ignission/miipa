"use client";

/**
 * カレンダー同期フック
 *
 * 全カレンダーを同期するフックを提供します。
 *
 * @module hooks/useSyncCalendars
 *
 * @example
 * ```tsx
 * const { sync, isSyncing, lastSyncTime, error } = useSyncCalendars();
 *
 * <button onClick={sync} disabled={isSyncing}>
 *   同期
 * </button>
 * {lastSyncTime && <span>最終同期: {lastSyncTime.toLocaleString()}</span>}
 * ```
 */

import { useCallback, useState } from "react";

/**
 * 同期エラーカレンダー情報
 */
interface ErrorCalendar {
	id: string;
	name: string;
	error: string;
}

/**
 * 同期APIレスポンスの型定義
 */
interface SyncResponse {
	success: boolean;
	syncedAt?: string;
	successCount?: number;
	errorCalendars?: ErrorCalendar[];
	error?: string;
}

/**
 * 同期結果の型定義
 */
export interface SyncResult {
	/** 同期成功数 */
	successCount: number;
	/** エラーが発生したカレンダー */
	errorCalendars: ErrorCalendar[];
}

/**
 * useSyncCalendars フックの戻り値型
 */
export interface UseSyncCalendarsResult {
	/** 全カレンダーを同期する */
	sync: () => Promise<SyncResult | null>;
	/** 同期中かどうか */
	isSyncing: boolean;
	/** 最終同期日時 */
	lastSyncTime: Date | null;
	/** エラー情報 */
	error: string | null;
}

/**
 * カレンダー同期フック
 *
 * POST /api/calendars/sync を呼び出し、全カレンダーを同期します。
 * 同期結果から lastSyncTime を取得して状態管理します。
 *
 * @returns 同期関数と状態
 */
export function useSyncCalendars(): UseSyncCalendarsResult {
	const [isSyncing, setIsSyncing] = useState(false);
	const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);

	/**
	 * 全カレンダーを同期する
	 *
	 * @returns 同期結果、失敗時はnull
	 */
	const sync = useCallback(async (): Promise<SyncResult | null> => {
		setIsSyncing(true);
		setError(null);

		try {
			const response = await fetch("/api/calendars/sync", {
				method: "POST",
			});
			const data: SyncResponse = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data.error ?? "カレンダーの同期に失敗しました");
			}

			// 最終同期時刻を更新
			if (data.syncedAt) {
				setLastSyncTime(new Date(data.syncedAt));
			}

			return {
				successCount: data.successCount ?? 0,
				errorCalendars: data.errorCalendars ?? [],
			};
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "カレンダーの同期に失敗しました";
			setError(message);
			return null;
		} finally {
			setIsSyncing(false);
		}
	}, []);

	return {
		sync,
		isSyncing,
		lastSyncTime,
		error,
	};
}
