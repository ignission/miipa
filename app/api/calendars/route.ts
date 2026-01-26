/**
 * カレンダー一覧 API エンドポイント
 *
 * 設定に登録されているカレンダー一覧を取得します。
 *
 * @endpoint GET /api/calendars
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/calendars');
 * const data = await response.json();
 *
 * // 成功レスポンス
 * // {
 * //   calendars: [
 * //     { id: "google-work", type: "google", name: "仕事", enabled: true, ... },
 * //     { id: "ical-holidays", type: "ical", name: "祝日", enabled: true, ... }
 * //   ]
 * // }
 *
 * // エラーレスポンス (500)
 * // {
 * //   error: { code: 'CONFIG_PARSE_ERROR', message: '設定ファイルの読み込みに失敗しました' }
 * // }
 * ```
 */

import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { isOk } from "@/lib/domain/shared";

/**
 * カレンダー一覧を取得する
 *
 * @returns カレンダー設定の配列
 */
export async function GET() {
	const result = await loadConfig();

	if (isOk(result)) {
		return NextResponse.json({
			calendars: result.value.calendars,
		});
	}

	// 設定ファイルが見つからない場合は空配列を返す
	if (result.error.code === "CONFIG_NOT_FOUND") {
		return NextResponse.json({
			calendars: [],
		});
	}

	// その他のエラー時は500を返す
	return NextResponse.json(
		{ error: { code: result.error.code, message: result.error.message } },
		{ status: 500 },
	);
}
