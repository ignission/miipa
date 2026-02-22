import { useEffect, useRef } from "react";
import { writeWidgetData } from "../store/app-group";
import { DEFAULT_CALENDAR_COLOR } from "../theme";
import type { UICalendarEvent } from "./useEvents";

/**
 * イベントデータが更新されたらApp GroupsにWidget用データを書き込むフック
 */
export function useWidgetData(events: UICalendarEvent[], isLoading = false) {
	const lastKeyRef = useRef<string>("");

	useEffect(() => {
		// ローディング中はスキップ
		if (isLoading) return;

		// イベントのキーを生成して重複書き込みを防止
		const key = events
			.map((e) => `${e.id}:${e.startTime.getTime()}`)
			.join(",");
		if (key === lastKeyRef.current) return;
		lastKeyRef.current = key;

		// eventsが空の場合もApp Groupストレージに空データを書き込み、
		// Widgetに古いデータが残存しないようにする
		const widgetData = {
			events: events.map((e) => ({
				id: e.id,
				title: e.title,
				startTime: e.startTime.toISOString(),
				endTime: e.endTime.toISOString(),
				isAllDay: e.isAllDay,
				calendarColor: e.color ?? DEFAULT_CALENDAR_COLOR,
				...(e.location ? { location: e.location } : {}),
			})),
			lastUpdated: new Date().toISOString(),
		};

		writeWidgetData(widgetData);
	}, [events, isLoading]);
}
