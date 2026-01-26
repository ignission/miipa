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
 * APIは既にOption型をnullableな値に変換して返します。
 */
interface SerializedCalendarEvent {
	id: string;
	title: string;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	location: string | null;
	description: string | null;
	source: {
		type: "google" | "ical";
		calendarName: string;
		accountEmail?: string;
	};
}

/**
 * UI表示用カレンダーイベント型
 *
 * EventCard/EventListコンポーネントで使用するための型定義です。
 * ドメインモデルのCalendarEventとは異なり、Option型ではなくnullableな値を使用します。
 */
export interface UICalendarEvent {
	/** イベントID */
	id: string;
	/** カレンダーID */
	calendarId: string;
	/** イベントタイトル */
	title: string;
	/** 開始時刻（ISO 8601形式） */
	startTime: string;
	/** 終了時刻（ISO 8601形式） */
	endTime: string;
	/** 終日イベントかどうか */
	isAllDay: boolean;
	/** 場所（nullの場合は表示しない） */
	location: string | null;
	/** 説明（nullの場合は表示しない） */
	description: string | null;
	/** イベントのソース情報 */
	source: {
		type: "google" | "ical";
		calendarName: string;
		accountEmail?: string;
	};
	/** カレンダー色 */
	color?: string;
}

/**
 * useEvents フックの戻り値型
 */
export interface UseEventsResult {
	/** イベント一覧（UI表示用に変換済み） */
	events: UICalendarEvent[];
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
 * シリアライズされたイベントをUI表示用オブジェクトに変換
 *
 * APIはOption型を既にnullable型に変換して返すため、
 * そのままUICalendarEventにマッピングします。
 *
 * @param serialized - APIから返されたシリアライズされたイベント
 * @returns UICalendarEventオブジェクト
 */
function deserializeEvent(
	serialized: SerializedCalendarEvent,
): UICalendarEvent {
	return {
		id: serialized.id,
		calendarId: "",
		title: serialized.title,
		startTime: serialized.startTime,
		endTime: serialized.endTime,
		isAllDay: serialized.isAllDay,
		location: serialized.location,
		description: serialized.description,
		source: serialized.source,
	};
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
	const [events, setEvents] = useState<UICalendarEvent[]>([]);
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
