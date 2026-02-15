/**
 * イベントのレスポンス形式
 */
export interface EventResponse {
	id: string;
	title: string;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	location: string | null;
	description: string | null;
	source: {
		type: "google" | "ical";
		calendarName: string;
		accountEmail?: string;
	};
}

/**
 * APIレスポンス形式
 */
export interface EventsApiResponse {
	events: EventResponse[];
	lastSync: string | null;
}

/**
 * APIから返されるシリアライズされたイベント型
 *
 * DateオブジェクトがISO文字列として返されます。
 * APIは既にOption型をnullableな値に変換して返します。
 */
export type SerializedCalendarEvent = EventResponse;
