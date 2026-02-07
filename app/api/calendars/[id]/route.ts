/**
 * カレンダー管理 API エンドポイント
 *
 * 指定されたIDのカレンダーに対する操作を提供します。
 *
 * @endpoint DELETE /api/calendars/[id] - カレンダーを削除
 * @endpoint PATCH /api/calendars/[id] - カレンダーの有効/無効を切り替え
 *
 * @example DELETE
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/calendars/google-work', {
 *   method: 'DELETE'
 * });
 *
 * // 成功レスポンス (204 No Content)
 * // レスポンスボディなし
 *
 * // カレンダーが見つからない場合 (404)
 * // {
 * //   error: { code: 'CALENDAR_NOT_FOUND', message: '指定されたカレンダーが見つかりません' }
 * // }
 *
 * // サーバーエラー (500)
 * // {
 * //   error: { code: 'CONFIG_SAVE_ERROR', message: '設定ファイルの保存に失敗しました' }
 * // }
 * ```
 *
 * @example PATCH
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/calendars/google-work', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ enabled: false })
 * });
 *
 * // 成功レスポンス (200 OK)
 * // {
 * //   calendar: { id: 'google-work', name: 'Work', type: 'google', enabled: false, ... }
 * // }
 *
 * // カレンダーが見つからない場合 (404)
 * // {
 * //   error: { code: 'CALENDAR_NOT_FOUND', message: '指定されたカレンダーが見つかりません' }
 * // }
 *
 * // 不正なリクエスト (400)
 * // {
 * //   error: { code: 'INVALID_REQUEST', message: 'enabled フィールドが必要です' }
 * // }
 * // ```
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import { createCalendarId } from "@/lib/domain/shared/types";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * ルートパラメータの型定義
 */
interface RouteParams {
	params: Promise<{
		id: string;
	}>;
}

/**
 * カレンダーを削除する
 *
 * @param _request - リクエストオブジェクト（未使用）
 * @param params - ルートパラメータ（カレンダーID）
 * @returns 削除結果
 */
export async function DELETE(
	_request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
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

	const { id } = await params;

	// カレンダー設定を取得
	const settingResult = await ctx.configRepository.getSetting("calendars");
	if (!isOk(settingResult)) {
		return NextResponse.json(
			{
				error: {
					code: "DB_ERROR",
					message: "設定取得エラー",
				},
			},
			{ status: 500 },
		);
	}

	// カレンダー一覧をパース
	const calendars: unknown[] =
		settingResult.value !== null ? JSON.parse(settingResult.value) : [];

	// 対象のカレンダーを検索
	const calendarIndex = calendars.findIndex((cal: any) => cal.id === id);

	if (calendarIndex === -1) {
		return NextResponse.json(
			{
				error: {
					code: "CALENDAR_NOT_FOUND",
					message: "指定されたカレンダーが見つかりません",
				},
			},
			{ status: 404 },
		);
	}

	// カレンダーを配列から削除
	const updatedCalendars = [
		...calendars.slice(0, calendarIndex),
		...calendars.slice(calendarIndex + 1),
	];

	// 更新した設定を保存
	const saveResult = await ctx.configRepository.setSetting(
		"calendars",
		JSON.stringify(updatedCalendars),
	);
	if (!isOk(saveResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_SAVE_ERROR",
					message: "設定の保存に失敗しました",
				},
			},
			{ status: 500 },
		);
	}

	// キャッシュされたイベントを削除
	const calendarId = createCalendarId(id);
	const deleteResult = await ctx.eventRepository.deleteByCalendar(calendarId);
	if (!isOk(deleteResult)) {
		// イベント削除に失敗しても、カレンダー自体は削除済みなので警告ログのみ
		console.warn(
			`カレンダー ${id} のキャッシュイベント削除に失敗しました: ${deleteResult.error.message}`,
		);
	}

	// 成功: 204 No Content を返す
	return new NextResponse(null, { status: 204 });
}

/**
 * カレンダーの有効/無効を切り替える
 *
 * @param request - リクエストオブジェクト（{ enabled: boolean }を含むJSON）
 * @param params - ルートパラメータ（カレンダーID）
 * @returns 更新されたカレンダー情報、またはエラー
 */
export async function PATCH(
	request: NextRequest,
	{ params }: RouteParams,
): Promise<NextResponse> {
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

	const { id } = await params;

	// リクエストボディをパース
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのJSON形式が不正です",
				},
			},
			{ status: 400 },
		);
	}

	// enabled フィールドのバリデーション
	if (
		typeof body !== "object" ||
		body === null ||
		!("enabled" in body) ||
		typeof (body as { enabled: unknown }).enabled !== "boolean"
	) {
		return NextResponse.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "enabled フィールド（boolean）が必要です",
				},
			},
			{ status: 400 },
		);
	}

	const { enabled } = body as { enabled: boolean };

	// カレンダー設定を取得
	const settingResult = await ctx.configRepository.getSetting("calendars");
	if (!isOk(settingResult)) {
		return NextResponse.json(
			{
				error: {
					code: "DB_ERROR",
					message: "設定取得エラー",
				},
			},
			{ status: 500 },
		);
	}

	const calendars: any[] =
		settingResult.value !== null ? JSON.parse(settingResult.value) : [];

	// 対象のカレンダーを検索
	const calendarIndex = calendars.findIndex((cal: any) => cal.id === id);

	if (calendarIndex === -1) {
		return NextResponse.json(
			{
				error: {
					code: "CALENDAR_NOT_FOUND",
					message: "指定されたカレンダーが見つかりません",
				},
			},
			{ status: 404 },
		);
	}

	// カレンダーの enabled フィールドを更新
	const updatedCalendar = { ...calendars[calendarIndex], enabled };

	const updatedCalendars = [
		...calendars.slice(0, calendarIndex),
		updatedCalendar,
		...calendars.slice(calendarIndex + 1),
	];

	// 更新した設定を保存
	const saveResult = await ctx.configRepository.setSetting(
		"calendars",
		JSON.stringify(updatedCalendars),
	);
	if (!isOk(saveResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_SAVE_ERROR",
					message: "設定の保存に失敗しました",
				},
			},
			{ status: 500 },
		);
	}

	// 成功: 更新されたカレンダーを返す
	return NextResponse.json({ calendar: updatedCalendar });
}
