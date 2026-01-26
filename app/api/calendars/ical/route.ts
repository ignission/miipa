/**
 * iCal カレンダー追加 API エンドポイント
 *
 * iCal URL からカレンダーを追加します。
 * URLを検証し、カレンダー名を取得して設定に保存します。
 *
 * @endpoint POST /api/calendars/ical
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/calendars/ical', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     url: 'https://example.com/calendar.ics',
 *     name: '祝日カレンダー' // 省略可
 *   })
 * });
 * const data = await response.json();
 *
 * // 成功レスポンス (201)
 * // {
 * //   calendar: {
 * //     id: "ical-xxx-yyy",
 * //     type: "ical",
 * //     name: "祝日カレンダー",
 * //     enabled: true,
 * //     icalUrl: "https://example.com/calendar.ics"
 * //   }
 * // }
 *
 * // バリデーションエラー (400)
 * // {
 * //   error: { code: 'INVALID_URL', message: 'URLを指定してください' }
 * // }
 *
 * // サーバーエラー (500)
 * // {
 * //   error: { code: 'CONFIG_SAVE_ERROR', message: '設定ファイルの保存に失敗しました' }
 * // }
 * ```
 */

import { type NextRequest, NextResponse } from "next/server";
import { addICalCalendar } from "@/lib/application/calendar";
import { isOk } from "@/lib/domain/shared";

/**
 * リクエストボディの型定義
 */
interface AddICalRequest {
	url: string;
	name?: string;
}

/**
 * iCal カレンダーを追加する
 *
 * @param request - リクエストオブジェクト
 * @returns 追加されたカレンダー設定
 */
export async function POST(request: NextRequest) {
	// リクエストボディをパース
	let body: AddICalRequest;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのパースに失敗しました",
				},
			},
			{ status: 400 },
		);
	}

	// URLの存在チェック
	if (!body.url || typeof body.url !== "string") {
		return NextResponse.json(
			{
				error: {
					code: "INVALID_URL",
					message: "URLを指定してください",
				},
			},
			{ status: 400 },
		);
	}

	// iCalカレンダーを追加
	const result = await addICalCalendar(body.url, body.name);

	if (isOk(result)) {
		return NextResponse.json(
			{
				calendar: result.value,
			},
			{ status: 201 },
		);
	}

	// エラーコードに応じてステータスコードを決定
	const errorCode = result.error.code;
	const isClientError =
		errorCode === "INVALID_URL" ||
		errorCode === "PARSE_ERROR" ||
		errorCode === "NETWORK_ERROR";

	return NextResponse.json(
		{ error: { code: errorCode, message: result.error.message } },
		{ status: isClientError ? 400 : 500 },
	);
}
