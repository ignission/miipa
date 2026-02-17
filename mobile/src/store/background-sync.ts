import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { fetchTodayEvents } from "../api/events";
import { DEFAULT_CALENDAR_COLOR } from "../theme";
import { writeWidgetData } from "./app-group";
import { syncToWatch } from "./watch-sync";

const BACKGROUND_FETCH_TASK = "miipa-background-sync";

/**
 * バックグラウンドタスクの定義
 *
 * 実行内容:
 * 1. APIからイベントを同期
 * 2. ローカルキャッシュ更新
 * 3. Widget用データ更新（App Groups）
 * 4. Watch用データ更新（WatchConnectivity）
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
	try {
		// APIからイベント取得
		const data = await fetchTodayEvents();

		// Widget用データを更新
		await writeWidgetData({
			events: data.events.map((e) => ({
				id: e.id,
				title: e.title,
				startTime: e.startTime,
				endTime: e.endTime,
				isAllDay: e.isAllDay,
				calendarColor: DEFAULT_CALENDAR_COLOR,
				...(e.location ? { location: e.location } : {}),
			})),
			lastUpdated: new Date().toISOString(),
		});

		// Watch同期（UICalendarEvent形式に変換して渡す）
		const uiEvents = data.events.map((e) => ({
			id: e.id,
			title: e.title,
			startTime: new Date(e.startTime),
			endTime: new Date(e.endTime),
			isAllDay: e.isAllDay,
			location: e.location,
			description: e.description,
			calendarId: "",
			source: e.source,
		}));
		await syncToWatch(uiEvents);

		console.log("[background-sync] 同期完了:", data.events.length, "件");
		return BackgroundFetch.BackgroundFetchResult.NewData;
	} catch (error) {
		console.error("[background-sync] 同期エラー:", error);
		return BackgroundFetch.BackgroundFetchResult.Failed;
	}
});

/**
 * バックグラウンド同期を登録
 *
 * 最小間隔15分でバックグラウンドfetchを実行。
 * iOS のバックグラウンドfetchはOSが最適なタイミングで実行するため、
 * 正確に15分間隔ではない。
 */
export async function registerBackgroundSync(): Promise<void> {
	try {
		const status = await BackgroundFetch.getStatusAsync();

		if (
			status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
			status === BackgroundFetch.BackgroundFetchStatus.Denied
		) {
			console.warn(
				"[background-sync] バックグラウンドfetchが許可されていません",
			);
			return;
		}

		await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
			minimumInterval: 15 * 60, // 15分
			stopOnTerminate: false,
			startOnBoot: true,
		});

		console.log("[background-sync] バックグラウンド同期を登録しました");
	} catch (error) {
		console.error("[background-sync] 登録エラー:", error);
	}
}

/**
 * バックグラウンド同期の登録を解除
 */
export async function unregisterBackgroundSync(): Promise<void> {
	try {
		await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
	} catch {
		// タスクが登録されていない場合のエラーは無視
	}
}
