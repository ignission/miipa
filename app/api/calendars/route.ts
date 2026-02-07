/**
 * カレンダー一覧 API エンドポイント
 *
 * 設定に登録されているカレンダー一覧を取得します。
 * 認証済みユーザーのD1データベースからカレンダー設定を取得します。
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
 * // エラーレスポンス (401)
 * // {
 * //   error: { code: 'UNAUTHORIZED', message: '認証が必要です' }
 * // }
 *
 * // エラーレスポンス (500)
 * // {
 * //   error: { code: 'DB_ERROR', message: 'データベース接続エラー' }
 * // }
 * ```
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * カレンダー一覧を取得する
 *
 * @returns カレンダー設定の配列
 */
export async function GET() {
	// 認証チェック
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json(
			{
				error: { code: "UNAUTHORIZED", message: "認証が必要です" },
			},
			{ status: 401 },
		);
	}

	// D1コンテキスト作成
	const dbResult = getD1Database();
	if (!isOk(dbResult)) {
		return NextResponse.json(
			{
				error: { code: "DB_ERROR", message: "データベース接続エラー" },
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

	// カレンダー一覧取得
	const settingResult = await ctx.configRepository.getSetting("calendars");
	if (!isOk(settingResult)) {
		return NextResponse.json(
			{
				error: { code: "DB_ERROR", message: "設定取得エラー" },
			},
			{ status: 500 },
		);
	}

	// 設定が見つからない場合は空配列を返す
	if (settingResult.value === null) {
		return NextResponse.json({ calendars: [] });
	}

	// JSON文字列をパースして返す
	try {
		const calendars = JSON.parse(settingResult.value);
		return NextResponse.json({ calendars });
	} catch {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_PARSE_ERROR",
					message: "カレンダー設定のパースに失敗しました",
				},
			},
			{ status: 500 },
		);
	}
}
