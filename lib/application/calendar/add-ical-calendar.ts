/**
 * iCalカレンダー追加ユースケース
 *
 * iCal URL からカレンダーを追加する機能を提供します。
 * URLを検証し、カレンダー名を取得して設定ファイルに保存します。
 *
 * @module lib/application/calendar/add-ical-calendar
 *
 * @example
 * ```typescript
 * import { addICalCalendar } from '@/lib/application/calendar/add-ical-calendar';
 * import { isOk, isErr } from '@/lib/domain/shared';
 *
 * // URLのみを指定（名前はiCalメタデータから自動取得）
 * const result = await addICalCalendar(ctx, 'https://example.com/calendar.ics');
 *
 * if (isOk(result)) {
 *   console.log(`カレンダーを追加しました: ${result.value.name}`);
 * } else {
 *   console.error(`エラー: ${result.error.message}`);
 * }
 *
 * // カスタム名を指定
 * const namedResult = await addICalCalendar(
 *   ctx,
 *   'https://example.com/holidays.ics',
 *   '日本の祝日'
 * );
 * ```
 */

import type { CalendarConfig } from "@/lib/config/types";
import type { CalendarContext } from "@/lib/context/calendar-context";
import {
	type CalendarError,
	createCalendarId,
	invalidUrl,
} from "@/lib/domain/calendar";
import { err, isErr, ok, type Result } from "@/lib/domain/shared";
import { type ICalMeta, validateICalUrl } from "@/lib/infrastructure/calendar";

// ============================================================
// 型定義
// ============================================================

/**
 * iCalカレンダー追加エラー
 *
 * addICalCalendar関数で発生する可能性のあるエラー型です。
 * CalendarErrorを拡張し、設定保存エラーも含みます。
 */
export type AddICalCalendarError = CalendarError | ConfigSaveError;

/**
 * 設定保存エラー
 *
 * 設定ファイルへの保存に失敗した場合のエラーです。
 */
export interface ConfigSaveError {
	/** エラーコード */
	readonly code: "CONFIG_SAVE_ERROR";
	/** エラーメッセージ */
	readonly message: string;
	/** 元のエラー */
	readonly cause?: unknown;
}

// ============================================================
// エラーファクトリ
// ============================================================

/**
 * 設定保存エラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - 元のエラー
 * @returns ConfigSaveErrorオブジェクト
 */
function configSaveError(message: string, cause?: unknown): ConfigSaveError {
	return {
		code: "CONFIG_SAVE_ERROR",
		message,
		cause,
	};
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * 一意のカレンダーIDを生成
 *
 * iCalカレンダー用の一意なIDを生成します。
 * 形式: ical-{timestamp}-{random}
 *
 * @returns CalendarId
 */
function generateUniqueCalendarId() {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return createCalendarId(`ical-${timestamp}-${random}`);
}

// ============================================================
// メイン関数
// ============================================================

/**
 * iCalカレンダーを追加
 *
 * 指定されたiCal URLを検証し、カレンダー設定として保存します。
 *
 * ## 処理フロー
 * 1. iCal URLの検証（validateICalUrl）
 *    - URLの形式チェック
 *    - 実際にフェッチしてiCalデータをパース
 *    - カレンダー名とイベント数を取得
 * 2. カレンダー名の決定
 *    - 引数で指定された場合はそれを使用
 *    - 未指定の場合はiCalメタデータから取得
 * 3. 一意のCalendarIdを生成
 * 4. CalendarConfigを作成
 * 5. 設定ファイルに保存
 *
 * @param ctx - カレンダーコンテキスト（依存性注入コンテナ）
 * @param url - iCal URLを指定
 * @param name - カレンダー名（省略時はiCalメタデータから取得）
 * @returns 成功時はOk<CalendarConfig>、失敗時はErr<AddICalCalendarError>
 *
 * @example
 * ```typescript
 * // 基本的な使い方
 * const result = await addICalCalendar(ctx, 'https://example.com/calendar.ics');
 *
 * if (isOk(result)) {
 *   const config = result.value;
 *   console.log(`ID: ${config.id}`);
 *   console.log(`名前: ${config.name}`);
 *   console.log(`URL: ${config.icalUrl}`);
 * }
 *
 * // エラーハンドリング
 * if (isErr(result)) {
 *   switch (result.error.code) {
 *     case 'INVALID_URL':
 *       console.error('無効なURLです');
 *       break;
 *     case 'NETWORK_ERROR':
 *       console.error('ネットワークエラーが発生しました');
 *       break;
 *     case 'PARSE_ERROR':
 *       console.error('iCalのパースに失敗しました');
 *       break;
 *     case 'CONFIG_SAVE_ERROR':
 *       console.error('設定の保存に失敗しました');
 *       break;
 *   }
 * }
 * ```
 */
export async function addICalCalendar(
	ctx: CalendarContext,
	url: string,
	name?: string,
): Promise<Result<CalendarConfig, AddICalCalendarError>> {
	// ------------------------------------------------------------
	// 1. 入力バリデーション
	// ------------------------------------------------------------
	if (!url || url.trim().length === 0) {
		return err(invalidUrl("URLを指定してください"));
	}

	// ------------------------------------------------------------
	// 2. iCal URLの検証
	// ------------------------------------------------------------
	const validateResult = await validateICalUrl(url);
	if (isErr(validateResult)) {
		return validateResult;
	}

	const icalMeta: ICalMeta = validateResult.value;

	// ------------------------------------------------------------
	// 3. カレンダー名の決定
	// ------------------------------------------------------------
	// 引数で指定された名前を優先、未指定の場合はiCalメタデータから取得
	const calendarName =
		name && name.trim().length > 0 ? name.trim() : icalMeta.name;

	// ------------------------------------------------------------
	// 4. CalendarConfigを作成
	// ------------------------------------------------------------
	const calendarId = generateUniqueCalendarId();
	const calendarConfig: CalendarConfig = {
		id: calendarId,
		type: "ical",
		name: calendarName,
		enabled: true,
		icalUrl: url,
	};

	// ------------------------------------------------------------
	// 5. 設定を保存
	// ------------------------------------------------------------
	// 既存のカレンダー設定を取得
	const existingCalendarsResult =
		await ctx.configRepository.getSetting("calendars");
	if (isErr(existingCalendarsResult)) {
		return err(
			configSaveError(
				"設定の読み込みに失敗しました",
				existingCalendarsResult.error,
			),
		);
	}
	const existingCalendars: CalendarConfig[] = existingCalendarsResult.value
		? (JSON.parse(existingCalendarsResult.value) as CalendarConfig[])
		: [];

	// 既存のカレンダー設定に追加
	const updatedCalendars = [...existingCalendars, calendarConfig];

	// 設定を保存
	const saveResult = await ctx.configRepository.setSetting(
		"calendars",
		JSON.stringify(updatedCalendars),
	);
	if (isErr(saveResult)) {
		return err(configSaveError("設定の保存に失敗しました", saveResult.error));
	}

	return ok(calendarConfig);
}
