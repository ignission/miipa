"use client";

/**
 * イベント取得フック
 *
 * 今日または今週のイベントをAPIから取得し、状態管理を行います。
 *
 * @module hooks/useEvents
 *
 * @example
 * ```tsx
 * const { events, isLoading, error, refresh, lastSync } = useEvents('today');
 *
 * if (isLoading) {
 *   return <Spinner />;
 * }
 *
 * if (error) {
 *   return <ErrorMessage error={error} onRetry={refresh} />;
 * }
 *
 * return <EventList events={events} />;
 * ```
 */

import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/domain/calendar/event";

/**
 * イベント取得範囲の型
 */
export type EventRange = "today" | "week";

/**
 * APIエラーレスポンスの型定義
 */
interface ApiError {
	code: string;
	message: string;
}

/**
 * イベントAPIレスポンスの型定義
 *
 * APIから返されるイベントデータの形式を定義します。
 * Dateオブジェクトは文字列としてシリアライズされます。
 */
interface EventsApiResponse {
	events: SerializedCalendarEvent[];
	lastSync: string;
	error?: ApiError;
}

/**
 * APIから返されるシリアライズされたイベント型
 *
 * DateオブジェクトがISO文字列として返されます。
 */
interface SerializedCalendarEvent {
	id: string;
	calendarId: string;
	title: string;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	location: { _tag: "Some"; value: string } | { _tag: "None" };
	description: { _tag: "Some"; value: string } | { _tag: "None" };
	source: {
		type: "google" | "ical";
		calendarName: string;
		accountEmail?: string;
	};
	color?: string;
}

/**
 * useEvents フックの戻り値型
 */
export interface UseEventsResult {
	/** イベント一覧 */
	events: CalendarEvent[];
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー情報（null の場合はエラーなし） */
	error: Error | null;
	/** イベントを再取得する関数 */
	refresh: () => Promise<void>;
	/** 最終同期日時（null の場合は未同期） */
	lastSync: Date | null;
}

/**
 * シリアライズされたイベントをドメインオブジェクトに変換
 *
 * @param serialized - APIから返されたシリアライズされたイベント
 * @returns CalendarEventオブジェクト
 */
function deserializeEvent(serialized: SerializedCalendarEvent): CalendarEvent {
	return {
		id: serialized.id,
		calendarId: serialized.calendarId,
		title: serialized.title,
		startTime: new Date(serialized.startTime),
		endTime: new Date(serialized.endTime),
		isAllDay: serialized.isAllDay,
		location: serialized.location,
		description: serialized.description,
		source: serialized.source,
	} as CalendarEvent;
}

/**
 * イベント取得フック
 *
 * 指定された範囲（今日/今週）のイベントをAPIから取得し、
 * ローディング状態、エラー状態、再取得機能を提供します。
 *
 * @param range - 取得する範囲（'today' | 'week'）
 * @returns イベント一覧と状態管理オブジェクト
 *
 * @example
 * ```tsx
 * function TodayView() {
 *   const { events, isLoading, error, refresh, lastSync } = useEvents('today');
 *
 *   if (isLoading) {
 *     return <div>読み込み中...</div>;
 *   }
 *
 *   if (error) {
 *     return (
 *       <div>
 *         <p>エラー: {error.message}</p>
 *         <button onClick={refresh}>再試行</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <div>
 *       {lastSync && <p>最終更新: {lastSync.toLocaleTimeString()}</p>}
 *       <EventList events={events} />
 *       <button onClick={refresh}>更新</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEvents(range: EventRange): UseEventsResult {
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const [lastSync, setLastSync] = useState<Date | null>(null);

	/**
	 * イベントを取得する
	 */
	const fetchEvents = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/events?range=${range}`);
			const data: EventsApiResponse = await response.json();

			if (!response.ok) {
				throw new Error(data.error?.message ?? "イベントの取得に失敗しました");
			}

			// シリアライズされたイベントをデシリアライズ
			const deserializedEvents = data.events.map(deserializeEvent);
			setEvents(deserializedEvents);

			// lastSyncをDateオブジェクトに変換
			if (data.lastSync) {
				setLastSync(new Date(data.lastSync));
			}
		} catch (err) {
			const errorInstance =
				err instanceof Error ? err : new Error("イベントの取得に失敗しました");
			setError(errorInstance);
		} finally {
			setIsLoading(false);
		}
	}, [range]);

	/**
	 * 手動で再取得する関数
	 */
	const refresh = useCallback(async () => {
		await fetchEvents();
	}, [fetchEvents]);

	// マウント時およびrange変更時にイベントを取得
	useEffect(() => {
		fetchEvents();
	}, [fetchEvents]);

	return {
		events,
		isLoading,
		error,
		refresh,
		lastSync,
	};
}
