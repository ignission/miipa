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
		accountEmail?: string | null;
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

/**
 * ブリーフィングAPIレスポンス
 *
 * 今日の予定サマリーとAI生成の挨拶文を返します。
 */
export interface BriefingResponse {
	/** ISO日付文字列 */
	date: string;
	/** 今日のイベント総数 */
	eventCount: number;
	/** 次の予定（時間指定イベントのうち現在時刻より後のもの） */
	nextEvent: {
		title: string;
		startTime: string;
		endTime: string;
		location: string | null;
		/** 現在時刻から開始までの分数 */
		minutesUntil: number;
	} | null;
	/** 直近2時間以内に開始する重要イベント（最大3件） */
	importantEvents: Array<{
		title: string;
		startTime: string;
		endTime: string;
		location: string | null;
	}>;
	/** 営業時間内（9:00-18:00）の空き時間合計（分） */
	freeTimeMinutes: number;
	/** 終日イベント一覧 */
	allDayEvents: Array<{ title: string }>;
	/** AI生成の挨拶文（キャッシュ未生成時はnull） */
	greeting: string | null;
}
