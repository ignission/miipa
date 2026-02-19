/**
 * イベント取得 Hono ルート
 *
 * カレンダーイベントを取得します。
 * 今日または今週のイベントを取得し、JSON形式で返却します。
 *
 * 対応元: app/api/events/route.ts → GET /events
 *
 * @query range - 取得範囲 ('today' | 'week')。省略時は 'today'
 */

import { Hono } from "hono";
import type { AppType } from "@/context/app-context";
import {
	getEventsForMonth,
	getEventsForToday,
	getEventsForWeek,
} from "@/lib/application/calendar";
import { createCalendarContext } from "@/lib/context/calendar-context";
import type { CalendarEvent } from "@/lib/domain/calendar";
import { isSome } from "@/lib/domain/shared/option";
import { isOk } from "@/lib/domain/shared/result";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

// ============================================================
// 型定義
// ============================================================

/** イベントのレスポンス形式 */
interface EventResponse {
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

/** APIレスポンス形式 */
interface EventsApiResponse {
	events: EventResponse[];
	lastSync: string | null;
}

// ============================================================
// ヘルパー
// ============================================================

/**
 * CalendarEvent をレスポンス形式に変換
 *
 * @param event - 変換対象の CalendarEvent
 * @returns API レスポンス用のイベントオブジェクト
 */
function toEventResponse(event: CalendarEvent): EventResponse {
	return {
		id: event.id,
		title: event.title,
		startTime: event.startTime.toISOString(),
		endTime: event.endTime.toISOString(),
		isAllDay: event.isAllDay,
		location: isSome(event.location) ? event.location.value : null,
		description: isSome(event.description) ? event.description.value : null,
		source: {
			type: event.source.type,
			calendarName: event.source.calendarName,
			...(event.source.accountEmail && {
				accountEmail: event.source.accountEmail,
			}),
		},
	};
}

// ============================================================
// ルート定義
// ============================================================

const events = new Hono<AppType>();

/**
 * GET /events - イベント一覧取得
 *
 * クエリパラメータ range ('today' | 'week') に応じた
 * カレンダーイベントを返します。
 */
events.get("/", async (c) => {
	const db = c.get("db");
	const userId = c.get("userId");
	const encryptionKeyBase64 = c.get("encryptionKey");

	// Base64文字列 → CryptoKey に変換
	const cryptoKeyResult = await importEncryptionKey(encryptionKeyBase64);
	if (!isOk(cryptoKeyResult)) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	// コンテキスト作成
	const ctx = createCalendarContext(db, userId, cryptoKeyResult.value);

	// クエリパラメータから range を取得
	const range = c.req.query("range") || "today";

	// range に応じた関数を呼び出し
	let result: Awaited<ReturnType<typeof getEventsForToday>>;
	if (range === "month") {
		const now = new Date();
		const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
		const yearParam = c.req.query("year");
		const monthParam = c.req.query("month");
		const year = yearParam
			? Number.parseInt(yearParam, 10)
			: jstNow.getUTCFullYear();
		const month = monthParam
			? Number.parseInt(monthParam, 10)
			: jstNow.getUTCMonth() + 1;
		result = await getEventsForMonth(ctx, year, month);
	} else if (range === "week") {
		result = await getEventsForWeek(ctx);
	} else {
		result = await getEventsForToday(ctx);
	}

	if (isOk(result)) {
		const eventList = result.value;

		// レスポンス形式に変換
		const eventResponses = eventList.map(toEventResponse);

		// lastSync は最新のイベント取得時刻として現在時刻を使用
		const response: EventsApiResponse = {
			events: eventResponses,
			lastSync: new Date().toISOString(),
		};

		return c.json(response);
	}

	// エラー時は500を返す
	return c.json(
		{
			error: {
				code: result.error.code,
				message: result.error.message,
			},
		},
		500,
	);
});

export { events };
