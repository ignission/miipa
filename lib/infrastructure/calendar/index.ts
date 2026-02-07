/**
 * カレンダーインフラストラクチャ層
 *
 * カレンダー機能に関するインフラストラクチャコンポーネントを提供します。
 * Google Calendar OAuth 認証、トークン管理、各種カレンダープロバイダを含みます。
 *
 * @module lib/infrastructure/calendar
 *
 * @example
 * ```typescript
 * import {
 *   // OAuth 認証
 *   generateAuthUrl,
 *   exchangeCode,
 *   refreshToken,
 *   isTokenExpired,
 *   type OAuthTokens,
 *   type AuthUrlInfo,
 *
 *   // トークンストア
 *   saveTokens,
 *   getTokens,
 *   deleteTokens,
 *   hasTokens,
 *
 *   // プロバイダ
 *   GoogleCalendarProvider,
 *   ICalProvider,
 *   validateICalUrl,
 *   type ICalMeta,
 * } from '@/lib/infrastructure/calendar';
 *
 * // OAuth フローの例
 * const authResult = generateAuthUrl();
 * if (isOk(authResult)) {
 *   // ユーザーを認証URLにリダイレクト
 *   redirect(authResult.value.url);
 * }
 *
 * // Google Calendar プロバイダの例
 * const provider = new GoogleCalendarProvider('user@gmail.com', tokens, secretRepo);
 * const calendars = await provider.getCalendars();
 *
 * // iCal プロバイダの例
 * const icalProvider = new ICalProvider(
 *   'https://example.com/calendar.ics',
 *   '祝日カレンダー',
 *   createCalendarId('ical-holidays')
 * );
 * ```
 */

// ============================================================
// OAuth サービス
// ============================================================

export {
	type AuthUrlInfo,
	exchangeCode,
	generateAuthUrl,
	isTokenExpired as isOAuthTokenExpired,
	type OAuthTokens,
	refreshToken,
} from "./oauth-service";

// ============================================================
// トークンストア
// ============================================================

export {
	deleteTokens,
	getTokens,
	hasTokens,
	isTokenExpired,
	type OAuthTokens as StoredOAuthTokens,
	saveTokens,
} from "./token-store";

// ============================================================
// Google Calendar プロバイダ
// ============================================================

export { GoogleCalendarProvider } from "./google-provider";

// ============================================================
// iCal プロバイダ
// ============================================================

export { type ICalMeta, ICalProvider, validateICalUrl } from "./ical-provider";
