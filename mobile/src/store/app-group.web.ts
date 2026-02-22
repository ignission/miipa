import type { WidgetData } from "./types";

export type { WidgetData };

/**
 * Web環境ではApp Groups (Widget連携) は利用不可のためno-op
 */
export async function writeWidgetData(_data: WidgetData): Promise<void> {
	// Web環境では何もしない
}
