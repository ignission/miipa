/**
 * 認証関連の定数
 *
 * JWT Cookie名、リフレッシュトークンCookie名などの認証関連定数を集約。
 * 複数ファイルでの重複定義を防止します。
 *
 * @module packages/api/src/lib/auth/constants
 */

/** JWT Cookie名 */
export const JWT_COOKIE_NAME = "miipa_token";

/** リフレッシュトークンCookie名 */
export const REFRESH_TOKEN_COOKIE_NAME = "miipa_refresh_token";
