import { Platform } from "react-native";
import type { UICalendarEvent } from "../hooks/useEvents";
import { DEFAULT_CALENDAR_COLOR } from "../theme";

// iOSのみで利用可能なため、モジュール読み込みに失敗した場合はnullにフォールバック
let watchConnectivity: typeof import("react-native-watch-connectivity") | null =
	null;
try {
	watchConnectivity = require("react-native-watch-connectivity");
} catch {
	// Android等、パッケージが利用できない環境では無視する
}

/**
 * Apple Watch にイベントデータを送信
 *
 * sendMessage（Watch画面アクティブ時のリアルタイム同期）と
 * transferCurrentComplicationUserInfo（Complication更新用、1日50回制限）の
 * 両方を使用し、どちらか一方が失敗しても他方の更新は行われるようにする。
 */
export async function syncToWatch(events: UICalendarEvent[]): Promise<void> {
	if (Platform.OS !== "ios") return;
	if (!watchConnectivity) return;

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

	// sendMessage: Watch画面がアクティブな場合にリアルタイム同期
	try {
		await watchConnectivity.sendMessage(
			{ type: "updateEvents", data: JSON.stringify(watchData) },
			(reply: unknown) => {
				console.log("[watch] sendMessage同期完了:", reply);
			},
			(error: unknown) => {
				// Watch画面が非アクティブの場合は失敗するが、Complication更新で補完される
				console.warn(
					"[watch] sendMessageエラー（非アクティブの可能性）:",
					error,
				);
			},
		);
	} catch (error) {
		console.warn("[watch] sendMessageエラー:", error);
	}

	// transferCurrentComplicationUserInfo: Complication更新用（バックグラウンドでも動作）
	try {
		watchConnectivity.transferCurrentComplicationUserInfo({
			type: "updateEvents",
			data: JSON.stringify(watchData),
		});
		console.log("[watch] Complication更新データ送信完了");
	} catch (error) {
		console.error("[watch] Complication更新エラー:", error);
	}
}
