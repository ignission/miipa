import { Platform } from "react-native";

// iOSのみで利用可能なため、モジュール読み込みに失敗した場合はnullにフォールバック
let SharedGroupPreferences: typeof import("react-native-shared-group-preferences").default | null =
	null;
try {
	SharedGroupPreferences =
		require("react-native-shared-group-preferences").default;
} catch {
	// Android等、パッケージが利用できない環境では無視する
}

const APP_GROUP_ID = "group.app.miipa.shared";

/**
 * Widget用データ構造
 */
export interface WidgetData {
	events: Array<{
		id: string;
		title: string;
		startTime: string;
		endTime: string;
		isAllDay: boolean;
		calendarColor: string;
		location?: string;
	}>;
	lastUpdated: string;
}

/**
 * App Groups (UserDefaults) にWidgetデータを書き込む
 * iOS のみ対応。Android ではno-op。
 */
export async function writeWidgetData(data: WidgetData): Promise<void> {
	if (Platform.OS !== "ios") return;
	if (!SharedGroupPreferences) return;

	try {
		await SharedGroupPreferences.setItem(
			"widgetData",
			JSON.stringify(data),
			APP_GROUP_ID,
		);
	} catch (error) {
		console.error("[widget] App Groups書き込みエラー:", error);
	}
}
