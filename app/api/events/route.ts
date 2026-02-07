/**
 * イベント取得 API エンドポイント
 *
 * Auth.jsによる認証とD1データベースコンテキストを使用して
 * カレンダーイベントを取得します。
 * 今日または今週のイベントを取得し、JSON形式で返却します。
 *
 * @endpoint GET /api/events
 *
 * @query range - 取得範囲 ('today' | 'week')。省略時は 'today'
 *
 * @example
 * ```typescript
 * // 今日のイベントを取得
 * const response = await fetch('/api/events');
 * const data = await response.json();
 *
 * // 今週のイベントを取得
 * const response = await fetch('/api/events?range=week');
 * const data = await response.json();
 *
 * // 成功レスポンス
 * // {
 * //   events: [
 * //     {
 * //       id: "event-123",
 * //       title: "定例ミーティング",
 * //       startTime: "2026-01-26T10:00:00.000Z",
 * //       endTime: "2026-01-26T11:00:00.000Z",
 * //       isAllDay: false,
 * //       location: "会議室A",
 * //       description: null,
 * //       source: { type: "google", calendarName: "仕事", accountEmail: "user@example.com" }
 * //     }
 * //   ],
 * //   lastSync: "2026-01-26T09:00:00.000Z"
 * // }
 *
 * // エラーレスポンス (401)
 * // {
 * //   error: { code: "UNAUTHORIZED", message: "認証が必要です" }
 * // }
 *
 * // エラーレスポンス (500)
 * // {
 * //   error: { code: "DB_ERROR", message: "データベース接続エラー" }
 * // }
 * ```
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
	getEventsForToday,
	getEventsForWeek,
} from "@/lib/application/calendar";
import { createCalendarContext } from "@/lib/context/calendar-context";
import type { CalendarEvent } from "@/lib/domain/calendar";
import { isSome } from "@/lib/domain/shared/option";
import { isOk } from "@/lib/domain/shared/result";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * イベントのレスポンス形式
 */
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

/**
 * APIレスポンス形式
 */
interface EventsApiResponse {
	events: EventResponse[];
	lastSync: string | null;
}

/**
 * CalendarEventをレスポンス形式に変換
 *
 * @param event - 変換対象のCalendarEvent
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

/**
 * イベントを取得する
 *
 * Auth.jsセッションで認証を行い、D1データベースコンテキストを構築して
 * カレンダーイベントを取得します。
 *
 * @param request - Next.js リクエストオブジェクト
 * @returns イベント一覧（events, lastSync）
 */
export async function GET(request: NextRequest) {
	// 認証チェック
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json(
			{
				error: {
					code: "UNAUTHORIZED",
					message: "認証が必要です",
				},
			},
			{ status: 401 },
		);
	}

	// D1データベース取得
	const dbResult = getD1Database();
	if (!isOk(dbResult)) {
		return NextResponse.json(
			{
				error: {
					code: "DB_ERROR",
					message: "データベース接続エラー",
				},
			},
			{ status: 500 },
		);
	}

	// 暗号化キー取得
	const keyResult = getEncryptionKey();
	if (!isOk(keyResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "暗号化キー取得エラー",
				},
			},
			{ status: 500 },
		);
	}

	// CryptoKeyにインポート
	const cryptoKeyResult = await importEncryptionKey(keyResult.value);
	if (!isOk(cryptoKeyResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "暗号化キーインポートエラー",
				},
			},
			{ status: 500 },
		);
	}

	// コンテキスト作成
	const ctx = createCalendarContext(
		dbResult.value,
		session.user.id,
		cryptoKeyResult.value,
	);

	// クエリパラメータからrangeを取得
	const { searchParams } = new URL(request.url);
	const range = searchParams.get("range") || "today";

	// rangeに応じた関数を呼び出し
	const result =
		range === "week"
			? await getEventsForWeek(ctx)
			: await getEventsForToday(ctx);

	if (isOk(result)) {
		const events = result.value;

		// レスポンス形式に変換
		const eventResponses = events.map(toEventResponse);

		// lastSyncは最新のイベント取得時刻として現在時刻を使用
		const response: EventsApiResponse = {
			events: eventResponses,
			lastSync: new Date().toISOString(),
		};

		return NextResponse.json(response);
	}

	// エラー時は500を返す
	return NextResponse.json(
		{
			error: {
				code: result.error.code,
				message: result.error.message,
			},
		},
		{ status: 500 },
	);
}
