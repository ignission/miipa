import { Platform } from "react-native";
import { setItem } from "../../modules/shared-user-defaults";

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

	try {
		await setItem("widgetData", JSON.stringify(data), APP_GROUP_ID);
	} catch (error) {
		console.error("[widget] App Groups書き込みエラー:", error);
	}
}
