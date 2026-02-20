import type { UICalendarEvent } from "../hooks/useEvents";

/**
 * Apple Watch にイベントデータを送信
 *
 * Watch アプリは App Groups 経由でデータを取得するため、
 * WatchConnectivity による直接通信は不要。
 * writeWidgetData() で App Groups にデータを書き込めば
 * Watch アプリが WatchDataStore 経由で読み取る。
 */
export async function syncToWatch(_events: UICalendarEvent[]): Promise<void> {
	// App Groups 経由の同期は background-sync.ts の writeWidgetData() で実施済み
	// Watch アプリは WatchDataStore.swift 経由で App Groups からデータを読み取る
}
