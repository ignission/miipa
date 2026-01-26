/**
 * カレンダー同期 API エンドポイント
 *
 * 全ての有効なカレンダーを同期し、最新のイベントを取得します。
 * 一部のカレンダーで失敗しても、他のカレンダーの同期は継続されます。
 *
 * @endpoint POST /api/calendars/sync
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/calendars/sync', { method: 'POST' });
 * const data = await response.json();
 *
 * // 成功レスポンス
 * // {
 * //   success: true,
 * //   syncedAt: "2024-01-15T12:00:00.000Z",
 * //   successCount: 3,
 * //   errorCalendars: []
 * // }
 *
 * // 部分的失敗レスポンス（一部のカレンダーのみ失敗）
 * // {
 * //   success: true,
 * //   syncedAt: "2024-01-15T12:00:00.000Z",
 * //   successCount: 2,
 * //   errorCalendars: [
 * //     { id: "google-work", name: "仕事", error: "認証情報が見つかりません" }
 * //   ]
 * // }
 *
 * // エラーレスポンス (500)
 * // {
 * //   success: false,
 * //   error: "設定の読み込みに失敗しました"
 * // }
 * ```
 */

import { NextResponse } from "next/server";
import { syncAllCalendars } from "@/lib/application/calendar";
import { isOk } from "@/lib/domain/shared";

/**
 * 全カレンダーを同期する
 *
 * @returns 同期結果（成功数、失敗したカレンダー情報）
 */
export async function POST() {
	const result = await syncAllCalendars();

	if (isOk(result)) {
		const { successCount, errorCalendars, syncedAt } = result.value;

		return NextResponse.json({
			success: true,
			syncedAt: syncedAt.toISOString(),
			successCount,
			errorCalendars: errorCalendars.map((ec) => ({
				id: ec.calendarId,
				name: ec.name,
				error: ec.error.message,
			})),
		});
	}

	// 設定読み込み失敗などの致命的エラー
	return NextResponse.json(
		{
			success: false,
			error: result.error.message,
		},
		{ status: 500 },
	);
}
