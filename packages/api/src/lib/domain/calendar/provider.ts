/**
 * カレンダープロバイダインターフェース
 *
 * Google Calendar、iCalなど各カレンダーソースの抽象インターフェースを定義。
 * 複数のカレンダーソースを統一的に扱うためのプロバイダパターンを実装します。
 *
 * @module lib/domain/calendar/provider
 */

import type { Result } from "@/lib/domain/shared/result";
import type { CalendarEvent } from "./event";
import type { CalendarId, CalendarType, TimeRange } from "./types";

// ============================================================
// エラー型
// ============================================================

/**
 * カレンダーエラーコード
 *
 * プロバイダで発生しうるエラーの種類を列挙します。
 *
 * - AUTH_REQUIRED: 認証が必要（初回認証未完了）
 * - AUTH_EXPIRED: 認証期限切れ（トークンリフレッシュ失敗）
 * - API_ERROR: APIエラー（レート制限、サーバーエラー等）
 * - NETWORK_ERROR: ネットワークエラー（接続失敗、タイムアウト等）
 * - PARSE_ERROR: パースエラー（iCalフォーマット不正等）
 * - NOT_FOUND: リソースが見つからない（カレンダーID不正等）
 * - INVALID_URL: 無効なURL（iCal URL不正等）
 */
export type CalendarErrorCode =
	| "AUTH_REQUIRED"
	| "AUTH_EXPIRED"
	| "API_ERROR"
	| "NETWORK_ERROR"
	| "PARSE_ERROR"
	| "NOT_FOUND"
	| "INVALID_URL";

/**
 * カレンダーエラー
 *
 * プロバイダで発生するエラーを表現する型。
 * discriminated unionパターンでエラーコードに応じた追加情報を持ちます。
 */
export interface CalendarError {
	/** エラーコード */
	readonly code: CalendarErrorCode;
	/** エラーメッセージ（ユーザー向け） */
	readonly message: string;
	/** AUTH_EXPIRED時のアカウント特定用メールアドレス */
	readonly accountEmail?: string;
	/** API_ERROR時のHTTPステータスコード */
	readonly statusCode?: number;
	/** 元の例外（デバッグ用） */
	readonly cause?: unknown;
}

// ============================================================
// エラーファクトリ関数
// ============================================================

/**
 * 認証が必要なエラーを生成
 *
 * @param message - エラーメッセージ
 * @returns CalendarError
 *
 * @example
 * ```typescript
 * return err(authRequired('Google Calendarの認証が必要です'));
 * ```
 */
export function authRequired(message: string): CalendarError {
	return { code: "AUTH_REQUIRED", message };
}

/**
 * 認証期限切れエラーを生成
 *
 * @param accountEmail - 期限切れになったアカウントのメールアドレス
 * @param message - エラーメッセージ
 * @returns CalendarError
 *
 * @example
 * ```typescript
 * return err(authExpired('user@example.com', 'トークンの更新に失敗しました'));
 * ```
 */
export function authExpired(
	accountEmail: string,
	message: string,
): CalendarError {
	return { code: "AUTH_EXPIRED", message, accountEmail };
}

/**
 * APIエラーを生成
 *
 * @param message - エラーメッセージ
 * @param statusCode - HTTPステータスコード
 * @param cause - 元の例外（オプション）
 * @returns CalendarError
 *
 * @example
 * ```typescript
 * return err(apiError('レート制限に達しました', 429, originalError));
 * ```
 */
export function apiError(
	message: string,
	statusCode: number,
	cause?: unknown,
): CalendarError {
	return { code: "API_ERROR", message, statusCode, cause };
}

/**
 * ネットワークエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - 元の例外（オプション）
 * @returns CalendarError
 *
 * @example
 * ```typescript
 * return err(networkError('サーバーに接続できませんでした', fetchError));
 * ```
 */
export function networkError(message: string, cause?: unknown): CalendarError {
	return { code: "NETWORK_ERROR", message, cause };
}

/**
 * パースエラーを生成
 *
 * @param message - エラーメッセージ
 * @param cause - 元の例外（オプション）
 * @returns CalendarError
 *
 * @example
 * ```typescript
 * return err(parseError('iCalフォーマットが不正です', parseException));
 * ```
 */
export function parseError(message: string, cause?: unknown): CalendarError {
	return { code: "PARSE_ERROR", message, cause };
}

/**
 * リソース未検出エラーを生成
 *
 * @param message - エラーメッセージ
 * @returns CalendarError
 *
 * @example
 * ```typescript
 * return err(notFound('指定されたカレンダーが見つかりません'));
 * ```
 */
export function notFound(message: string): CalendarError {
	return { code: "NOT_FOUND", message };
}

/**
 * 無効なURLエラーを生成
 *
 * @param message - エラーメッセージ
 * @returns CalendarError
 *
 * @example
 * ```typescript
 * return err(invalidUrl('iCal URLの形式が正しくありません'));
 * ```
 */
export function invalidUrl(message: string): CalendarError {
	return { code: "INVALID_URL", message };
}

// ============================================================
// カレンダー情報
// ============================================================

/**
 * プロバイダから取得したカレンダー情報
 *
 * 各プロバイダが返すカレンダーのメタ情報を表現します。
 * ユーザーがどのカレンダーを同期対象とするか選択する際に使用されます。
 */
export interface ProviderCalendar {
	/** カレンダーの一意識別子（プロバイダ固有） */
	readonly id: string;
	/** カレンダーの表示名 */
	readonly name: string;
	/** プライマリカレンダーかどうか */
	readonly primary: boolean;
	/** カレンダーの表示色（16進数カラーコード） */
	readonly color?: string;
}

// ============================================================
// プロバイダインターフェース
// ============================================================

/**
 * カレンダープロバイダ
 *
 * Google Calendar、iCalなど各カレンダーソースの抽象インターフェース。
 * 異なるカレンダーソースを統一的なAPIで扱えるようにします。
 *
 * @example
 * ```typescript
 * // Google Calendar プロバイダの使用例
 * const provider: CalendarProvider = new GoogleCalendarProvider(credentials);
 *
 * // カレンダー一覧を取得
 * const calendarsResult = await provider.getCalendars();
 * if (isOk(calendarsResult)) {
 *   for (const cal of calendarsResult.value) {
 *     console.log(`${cal.name} (${cal.id})`);
 *   }
 * }
 *
 * // イベントを取得
 * const eventsResult = await provider.getEvents(
 *   calendarId,
 *   { start: new Date(), end: addDays(new Date(), 7) }
 * );
 * ```
 */
export interface CalendarProvider {
	/** プロバイダの種類（google, ical等） */
	readonly type: CalendarType;

	/**
	 * カレンダー一覧を取得
	 *
	 * アカウントに紐づくすべてのカレンダーのリストを返します。
	 * ユーザーが同期対象を選択するためのUIに使用されます。
	 *
	 * @returns カレンダー情報の配列、またはエラー
	 */
	getCalendars(): Promise<Result<ProviderCalendar[], CalendarError>>;

	/**
	 * 指定期間のイベントを取得
	 *
	 * 指定したカレンダーの指定期間内にあるイベントを返します。
	 * 繰り返しイベントは展開された状態で返されます。
	 *
	 * @param calendarId - 取得対象のカレンダーID
	 * @param range - 取得期間（開始日時と終了日時）
	 * @returns イベントの配列、またはエラー
	 */
	getEvents(
		calendarId: CalendarId,
		range: TimeRange,
	): Promise<Result<CalendarEvent[], CalendarError>>;
}
