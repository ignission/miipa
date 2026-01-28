/**
 * Googleカレンダー追加ユースケース
 *
 * Google Calendar の OAuth 認証フローを開始し、認証完了後にカレンダーを
 * 設定に追加する機能を提供します。
 *
 * ## 処理フロー
 *
 * 1. `startGoogleAuth()`: OAuth 認証URLを生成
 * 2. ユーザーがブラウザで認証を完了
 * 3. `completeGoogleAuth()`: コードをトークンに交換し、カレンダーを追加
 *
 * @module lib/application/calendar/add-google-calendar
 *
 * @example
 * ```typescript
 * import {
 *   startGoogleAuth,
 *   completeGoogleAuth,
 * } from '@/lib/application/calendar/add-google-calendar';
 * import { isOk } from '@/lib/domain/shared';
 *
 * // 1. 認証URLを取得
 * const authResult = startGoogleAuth();
 * if (isOk(authResult)) {
 *   const { url, codeVerifier, state } = authResult.value;
 *   // codeVerifier と state をセッションに保存
 *   // ユーザーを url にリダイレクト
 * }
 *
 * // 2. コールバック後、トークン交換とカレンダー追加
 * const completeResult = await completeGoogleAuth(code, savedCodeVerifier);
 * if (isOk(completeResult)) {
 *   console.log(`${completeResult.value.addedCalendars.length}個のカレンダーを追加しました`);
 * }
 * ```
 */

import { google } from "googleapis";
import {
	type CalendarConfig,
	loadOrInitializeConfig,
	saveConfig,
} from "@/lib/config";
import type { CalendarError } from "@/lib/domain/calendar";
import { apiError, networkError } from "@/lib/domain/calendar";
import { err, isErr, ok, type Result } from "@/lib/domain/shared";
import { createCalendarId } from "@/lib/domain/shared/types";
import {
	type AuthUrlInfo,
	exchangeCode,
	GoogleCalendarProvider,
	generateAuthUrl,
	type OAuthTokens,
	saveTokens,
} from "@/lib/infrastructure/calendar";
import { initializeDatabase } from "@/lib/infrastructure/db";

// ============================================================
// 型定義
// ============================================================

/**
 * Googleカレンダー追加エラー
 *
 * Googleカレンダー追加処理で発生しうるエラーを表現します。
 */
export interface AddGoogleCalendarError {
	/** エラーコード */
	readonly code: AddGoogleCalendarErrorCode;
	/** エラーメッセージ（ユーザー向け） */
	readonly message: string;
	/** 元のエラー（デバッグ用） */
	readonly cause?: unknown;
}

/**
 * Googleカレンダー追加エラーコード
 *
 * - AUTH_URL_GENERATION_FAILED: 認証URL生成に失敗
 * - TOKEN_EXCHANGE_FAILED: トークン交換に失敗
 * - TOKEN_SAVE_FAILED: トークン保存に失敗
 * - USER_INFO_FAILED: ユーザー情報取得に失敗
 * - CALENDAR_LIST_FAILED: カレンダー一覧取得に失敗
 * - CONFIG_SAVE_FAILED: 設定保存に失敗
 */
export type AddGoogleCalendarErrorCode =
	| "AUTH_URL_GENERATION_FAILED"
	| "TOKEN_EXCHANGE_FAILED"
	| "TOKEN_SAVE_FAILED"
	| "USER_INFO_FAILED"
	| "CALENDAR_LIST_FAILED"
	| "CONFIG_SAVE_FAILED";

/**
 * Googleカレンダー追加結果
 *
 * 認証完了後に返される結果情報です。
 */
export interface AddGoogleCalendarResult {
	/** 追加されたGoogleアカウントのメールアドレス */
	readonly accountEmail: string;
	/** 追加されたカレンダー設定の配列 */
	readonly addedCalendars: readonly CalendarConfig[];
}

// ============================================================
// エラーファクトリ
// ============================================================

/**
 * 認証URL生成エラーを生成
 */
function authUrlGenerationError(cause: CalendarError): AddGoogleCalendarError {
	return {
		code: "AUTH_URL_GENERATION_FAILED",
		message: `認証URLの生成に失敗しました: ${cause.message}`,
		cause,
	};
}

/**
 * トークン交換エラーを生成
 */
function tokenExchangeError(cause: CalendarError): AddGoogleCalendarError {
	return {
		code: "TOKEN_EXCHANGE_FAILED",
		message: `認証コードの交換に失敗しました: ${cause.message}`,
		cause,
	};
}

/**
 * トークン保存エラーを生成
 */
function tokenSaveError(cause: unknown): AddGoogleCalendarError {
	return {
		code: "TOKEN_SAVE_FAILED",
		message: "トークンの保存に失敗しました。",
		cause,
	};
}

/**
 * ユーザー情報取得エラーを生成
 */
function userInfoError(cause: unknown): AddGoogleCalendarError {
	return {
		code: "USER_INFO_FAILED",
		message: "Googleアカウント情報の取得に失敗しました。",
		cause,
	};
}

/**
 * カレンダー一覧取得エラーを生成
 */
function calendarListError(cause: CalendarError): AddGoogleCalendarError {
	return {
		code: "CALENDAR_LIST_FAILED",
		message: `カレンダー一覧の取得に失敗しました: ${cause.message}`,
		cause,
	};
}

/**
 * 設定保存エラーを生成
 */
function configSaveError(cause: unknown): AddGoogleCalendarError {
	return {
		code: "CONFIG_SAVE_FAILED",
		message: "設定ファイルの保存に失敗しました。",
		cause,
	};
}

// ============================================================
// 内部ユーティリティ
// ============================================================

/** Google OAuth クライアントID（環境変数から取得） */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/** Google OAuth クライアントシークレット（環境変数から取得） */
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * Google UserInfo API を使用してユーザーのメールアドレスを取得
 *
 * @param tokens - OAuth トークン
 * @returns ユーザーのメールアドレス、またはエラー
 */
async function getUserEmail(
	tokens: OAuthTokens,
): Promise<Result<string, CalendarError>> {
	const oauth2Client = new google.auth.OAuth2(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
	);
	oauth2Client.setCredentials({
		access_token: tokens.accessToken,
		refresh_token: tokens.refreshToken,
	});

	try {
		const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
		const response = await oauth2.userinfo.get();

		if (!response.data.email) {
			return err(apiError("メールアドレスが取得できませんでした", 400));
		}

		return ok(response.data.email);
	} catch (error) {
		return err(networkError("ユーザー情報の取得に失敗しました", error));
	}
}

/**
 * カレンダーIDを生成
 *
 * accountEmail と googleCalendarId から一意のIDを生成します。
 *
 * @param accountEmail - Googleアカウントのメールアドレス
 * @param googleCalendarId - GoogleカレンダーのID
 * @returns 生成されたCalendarId
 */
function generateCalendarConfigId(
	accountEmail: string,
	googleCalendarId: string,
): string {
	// メールアドレスとカレンダーIDを組み合わせて一意のIDを生成
	const sanitizedEmail = accountEmail.replace(/[^a-zA-Z0-9]/g, "-");
	const sanitizedCalendarId = googleCalendarId.replace(/[^a-zA-Z0-9]/g, "-");
	return `google-${sanitizedEmail}-${sanitizedCalendarId}`;
}

// ============================================================
// 公開関数
// ============================================================

/**
 * Google認証フローを開始
 *
 * OAuth 2.0 PKCE フローの認証URLを生成します。
 * 返された `codeVerifier` と `state` は、コールバック処理時まで
 * 安全に保存しておく必要があります。
 *
 * @returns 認証URL情報、またはエラー
 *
 * @example
 * ```typescript
 * const result = startGoogleAuth();
 * if (isOk(result)) {
 *   const { url, codeVerifier, state } = result.value;
 *   // セッションに保存
 *   session.codeVerifier = codeVerifier;
 *   session.state = state;
 *   // ユーザーをリダイレクト
 *   redirect(url);
 * }
 * ```
 */
export function startGoogleAuth(): Result<AuthUrlInfo, AddGoogleCalendarError> {
	const authUrlResult = generateAuthUrl();

	if (isErr(authUrlResult)) {
		return err(authUrlGenerationError(authUrlResult.error));
	}

	return ok(authUrlResult.value);
}

/**
 * Google認証を完了し、カレンダーを追加
 *
 * OAuth コールバックで受け取った認証コードをトークンに交換し、
 * アカウントのカレンダー一覧を取得して設定に追加します。
 *
 * ## 処理フロー
 *
 * 1. 認証コードをトークンに交換
 * 2. トークンを暗号化DBに保存
 * 3. ユーザーのメールアドレスを取得
 * 4. カレンダー一覧を取得
 * 5. 各カレンダーを設定に保存
 *
 * @param code - OAuth コールバックで受け取った認証コード
 * @param codeVerifier - `startGoogleAuth()` で生成した code_verifier
 * @returns 追加されたカレンダー情報、またはエラー
 *
 * @example
 * ```typescript
 * // コールバックハンドラ内で使用
 * const result = await completeGoogleAuth(
 *   searchParams.code,
 *   session.codeVerifier
 * );
 *
 * if (isOk(result)) {
 *   console.log(`アカウント: ${result.value.accountEmail}`);
 *   console.log(`追加したカレンダー数: ${result.value.addedCalendars.length}`);
 * } else {
 *   console.error(`エラー: [${result.error.code}] ${result.error.message}`);
 * }
 * ```
 */
export async function completeGoogleAuth(
	code: string,
	codeVerifier: string,
): Promise<Result<AddGoogleCalendarResult, AddGoogleCalendarError>> {
	// ------------------------------------------------------------
	// 1. 認証コードをトークンに交換
	// ------------------------------------------------------------
	const tokenResult = await exchangeCode(code, codeVerifier);
	if (isErr(tokenResult)) {
		return err(tokenExchangeError(tokenResult.error));
	}
	const tokens = tokenResult.value;

	// ------------------------------------------------------------
	// 2. ユーザーのメールアドレスを取得
	// ------------------------------------------------------------
	const emailResult = await getUserEmail(tokens);
	if (isErr(emailResult)) {
		return err(userInfoError(emailResult.error));
	}
	const accountEmail = emailResult.value;

	// ------------------------------------------------------------
	// 3. トークンを暗号化DBに保存
	// ------------------------------------------------------------
	// データベースを初期化
	const dbResult = initializeDatabase();
	if (isErr(dbResult)) {
		return err(tokenSaveError(dbResult.error));
	}

	const saveTokenResult = await saveTokens(accountEmail, tokens);
	if (isErr(saveTokenResult)) {
		return err(tokenSaveError(saveTokenResult.error));
	}

	// ------------------------------------------------------------
	// 4. カレンダー一覧を取得
	// ------------------------------------------------------------
	const provider = new GoogleCalendarProvider(accountEmail, tokens);
	const calendarsResult = await provider.getCalendars();
	if (isErr(calendarsResult)) {
		return err(calendarListError(calendarsResult.error));
	}
	const providerCalendars = calendarsResult.value;

	// ------------------------------------------------------------
	// 5. 各カレンダーを設定に保存
	// ------------------------------------------------------------
	const configResult = await loadOrInitializeConfig();
	if (isErr(configResult)) {
		return err(configSaveError(configResult.error));
	}

	const existingConfig = configResult.value;
	const existingCalendarIds = new Set(
		existingConfig.calendars.map((c) => c.id as string),
	);

	// 新しいカレンダー設定を作成（既存のものと重複しない）
	const newCalendars: CalendarConfig[] = [];
	for (const providerCal of providerCalendars) {
		const configId = generateCalendarConfigId(accountEmail, providerCal.id);

		// 既に同じIDが存在する場合はスキップ
		if (existingCalendarIds.has(configId)) {
			continue;
		}

		const calendarConfig: CalendarConfig = {
			id: createCalendarId(configId),
			type: "google",
			name: providerCal.name,
			enabled: providerCal.primary, // プライマリカレンダーのみ最初から有効
			color: providerCal.color,
			googleAccountEmail: accountEmail,
			googleCalendarId: providerCal.id,
		};

		newCalendars.push(calendarConfig);
	}

	// 設定を更新して保存
	const updatedConfig = {
		...existingConfig,
		calendars: [...existingConfig.calendars, ...newCalendars],
	};

	const saveResult = await saveConfig(updatedConfig);
	if (isErr(saveResult)) {
		return err(configSaveError(saveResult.error));
	}

	return ok({
		accountEmail,
		addedCalendars: newCalendars,
	});
}
