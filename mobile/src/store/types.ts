/** iOS Widget に渡すイベント情報と最終更新日時 */
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
