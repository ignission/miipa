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
 *   type OAuthTokens,
 *   type OAuthConfig,
 *   type AuthUrlInfo,
 *
 *   // プロバイダ
 *   GoogleCalendarProvider,
 *   ICalProvider,
 *   validateICalUrl,
 *   type ICalMeta,
 * } from '@/lib/infrastructure/calendar';
 *
 * // OAuth フローの例
 * const authResult = generateAuthUrl(oauthConfig);
 * if (isOk(authResult)) {
 *   // ユーザーを認証URLにリダイレクト
 *   redirect(authResult.value.url);
 * }
 *
 * // Google Calendar プロバイダの例
 * const provider = new GoogleCalendarProvider('user@gmail.com', tokens, secretRepo, oauthConfig);
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
	type OAuthConfig,
	type OAuthTokens,
} from "./oauth-service";

// ============================================================
// Google Calendar プロバイダ
// ============================================================

export { GoogleCalendarProvider } from "./google-provider";

// ============================================================
// iCal プロバイダ
// ============================================================

export { type ICalMeta, ICalProvider, validateICalUrl } from "./ical-provider";
