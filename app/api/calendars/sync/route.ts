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
 * // 認証エラー (401)
 * // {
 * //   error: { code: 'UNAUTHORIZED', message: '認証が必要です' }
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
import { auth } from "@/auth";
import { syncAllCalendars } from "@/lib/application/calendar";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * 全カレンダーを同期する
 *
 * @returns 同期結果（成功数、失敗したカレンダー情報）
 */
export async function POST() {
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

	// D1コンテキスト作成
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
	const ctx = createCalendarContext(
		dbResult.value,
		session.user.id,
		cryptoKeyResult.value,
	);

	const result = await syncAllCalendars(ctx);

	if (isOk(result)) {
		console.log(
			`[sync-api] 同期完了: total=${result.value.totalCount}, success=${result.value.successCount}, errors=${result.value.errorCalendars.length}`,
		);
		for (const ec of result.value.errorCalendars) {
			console.error(
				`[sync-api] エラーカレンダー: ${ec.calendarId} (${ec.name}): ${ec.error.message}`,
			);
		}
	} else {
		console.error(`[sync-api] 同期致命的エラー:`, result.error.message);
	}

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
