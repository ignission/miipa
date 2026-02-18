/**
 * Widget用データ構造
 * (app-group.ts と同一の型定義。循環importを避けるため独立定義)
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
 * Web環境ではApp Groups (Widget連携) は利用不可のためno-op
 */
export async function writeWidgetData(_data: WidgetData): Promise<void> {
	// Web環境では何もしない
}
