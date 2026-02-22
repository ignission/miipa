import { Platform } from "react-native";
import { setItem } from "../../modules/shared-user-defaults";
import type { WidgetData } from "./types";

export type { WidgetData };

const APP_GROUP_ID = "group.app.miipa.shared";

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
