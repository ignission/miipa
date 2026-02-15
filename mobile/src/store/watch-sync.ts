import { Platform } from "react-native";
import type { UICalendarEvent } from "../hooks/useEvents";
import { DEFAULT_CALENDAR_COLOR } from "../theme";

/**
 * Apple Watch にイベントデータを送信
 *
 * WatchConnectivity の transferCurrentComplicationUserInfo を使用。
 * 1日50回の制限あり。
 */
export async function syncToWatch(events: UICalendarEvent[]): Promise<void> {
	if (Platform.OS !== "ios") return;

	try {
		const { sendMessage } = require("react-native-watch-connectivity");

		const watchData = {
			events: events.slice(0, 10).map((e) => ({
				id: e.id,
				title: e.title,
				startTime: e.startTime.toISOString(),
				endTime: e.endTime.toISOString(),
				isAllDay: e.isAllDay,
				calendarColor: e.color ?? DEFAULT_CALENDAR_COLOR,
				location: e.location ?? undefined,
			})),
			lastUpdated: new Date().toISOString(),
		};

		await sendMessage(
			{ type: "updateEvents", data: JSON.stringify(watchData) },
			(reply: unknown) => {
				console.log("[watch] 同期完了:", reply);
			},
			(error: unknown) => {
				console.error("[watch] 同期エラー:", error);
			},
		);
	} catch (error) {
		console.error("[watch] Watch同期エラー:", error);
	}
}
