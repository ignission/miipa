import { useCallback, useState } from "react";
import type { SyncResponse } from "../api/calendars";
import { syncCalendars } from "../api/calendars";

// ============================================================
// 型定義
// ============================================================

/** 同期エラーカレンダー情報 */
interface ErrorCalendar {
	id: string;
	name: string;
	error: string;
}

/** 同期結果 */
export interface SyncResult {
	/** 同期成功数 */
	successCount: number;
	/** エラーが発生したカレンダー */
	errorCalendars: ErrorCalendar[];
}

/** useSyncStatus フックの戻り値型 */
export interface UseSyncStatusResult {
	/** 全カレンダーを同期する */
	sync: () => Promise<SyncResult | null>;
	/** 同期中かどうか */
	isSyncing: boolean;
	/** 最終同期日時 */
	lastSyncTime: Date | null;
	/** エラー情報 */
	error: string | null;
}

// ============================================================
// メインフック
// ============================================================

/**
 * カレンダー同期状態管理フック
 *
 * カレンダー同期の状態（syncing, lastSync, error）を管理します。
 * Web の useSyncCalendars からの移植です。
 * useCalendars の useSyncCalendars とは異なり、
 * 同期状態の詳細（lastSyncTime, エラー詳細）を追跡します。
 */
export function useSyncStatus(): UseSyncStatusResult {
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
			const data: SyncResponse = await syncCalendars();

			if (!data.success) {
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
