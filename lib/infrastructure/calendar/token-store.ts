/**
 * OAuthトークンストアモジュール
 *
 * Google Calendar OAuth トークンを macOS Keychain に安全に保存・取得する機能を提供します。
 * アカウントメールごとに独立したキーでトークンを管理します。
 *
 * @module lib/infrastructure/calendar/token-store
 * @example
 * ```typescript
 * import {
 *   saveTokens,
 *   getTokens,
 *   deleteTokens,
 *   hasTokens,
 *   isTokenExpired,
 *   type OAuthTokens,
 * } from '@/lib/infrastructure/calendar/token-store';
 *
 * // トークンを保存
 * await saveTokens('user@gmail.com', {
 *   accessToken: 'ya29.xxx',
 *   refreshToken: '1//xxx',
 *   expiresAt: new Date(Date.now() + 3600 * 1000),
 * });
 *
 * // トークンを取得
 * const result = await getTokens('user@gmail.com');
 * if (isOk(result) && isSome(result.value)) {
 *   const tokens = result.value.value;
 *   if (isTokenExpired(tokens)) {
 *     // リフレッシュ処理
 *   }
 * }
 * ```
 */

import keytar from "keytar";
import {
	err,
	type KeychainError,
	keychainAccessDenied,
	keychainWriteFailed,
	none,
	type Option,
	ok,
	type Result,
	some,
} from "@/lib/domain/shared";
import { KEYCHAIN_SERVICE } from "@/lib/infrastructure/keychain";

// ============================================================
// 型定義
// ============================================================

/**
 * OAuthトークン
 *
 * Google OAuth 2.0 で取得したトークン情報を保持します。
 */
export interface OAuthTokens {
	/** アクセストークン（API呼び出し用） */
	readonly accessToken: string;
	/** リフレッシュトークン（アクセストークン更新用） */
	readonly refreshToken: string;
	/** アクセストークンの有効期限 */
	readonly expiresAt: Date;
}

/**
 * シリアライズされたトークン形式
 *
 * Keychainに保存する際のJSON形式。
 * DateはISO8601文字列として保存します。
 */
interface StoredTokens {
	readonly accessToken: string;
	readonly refreshToken: string;
	readonly expiresAt: string; // ISO8601
}

// ============================================================
// 内部ユーティリティ
// ============================================================

/**
 * トークンのKeychainキーを生成
 *
 * @param accountEmail - Googleアカウントのメールアドレス
 * @returns Keychainで使用するキー文字列
 */
function getTokenKey(accountEmail: string): string {
	return `google-oauth-${accountEmail}`;
}

/**
 * keytarエラーをKeychainErrorに変換
 *
 * @param error - 発生したエラー
 * @param operation - 操作名（日本語）
 * @returns KeychainError
 */
function mapKeytarError(error: unknown, operation: string): KeychainError {
	const errorMessage = error instanceof Error ? error.message : String(error);

	// アクセス拒否エラーの判定
	if (
		errorMessage.includes("denied") ||
		errorMessage.includes("permission") ||
		errorMessage.includes("access")
	) {
		return keychainAccessDenied(
			KEYCHAIN_SERVICE,
			`Keychainへの${operation}が拒否されました。システム環境設定でアクセスを許可してください`,
			error,
		);
	}

	// その他のエラー
	return keychainWriteFailed(
		KEYCHAIN_SERVICE,
		`Keychainの${operation}に失敗しました: ${errorMessage}`,
		error,
	);
}

// ============================================================
// トークン操作関数
// ============================================================

/**
 * トークンを保存
 *
 * 指定されたアカウントのOAuthトークンをKeychainに保存します。
 * 同じアカウントのトークンが既に存在する場合は上書きします。
 *
 * @param accountEmail - Googleアカウントのメールアドレス
 * @param tokens - 保存するOAuthトークン
 * @returns 成功時はOk(void)、失敗時はErr(KeychainError)
 *
 * @example
 * ```typescript
 * const result = await saveTokens('user@gmail.com', {
 *   accessToken: 'ya29.xxx',
 *   refreshToken: '1//xxx',
 *   expiresAt: new Date(Date.now() + 3600 * 1000),
 * });
 *
 * if (isOk(result)) {
 *   console.log('トークンを保存しました');
 * }
 * ```
 */
export async function saveTokens(
	accountEmail: string,
	tokens: OAuthTokens,
): Promise<Result<void, KeychainError>> {
	const key = getTokenKey(accountEmail);
	const stored: StoredTokens = {
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken,
		expiresAt: tokens.expiresAt.toISOString(),
	};

	try {
		await keytar.setPassword(KEYCHAIN_SERVICE, key, JSON.stringify(stored));
		return ok(undefined);
	} catch (error) {
		return err(mapKeytarError(error, "書き込み"));
	}
}

/**
 * トークンを取得
 *
 * 指定されたアカウントのOAuthトークンをKeychainから取得します。
 * トークンが存在しない場合は `Ok(None)` を返します。
 * トークンのパースに失敗した場合も `Ok(None)` を返します（破損データとして扱う）。
 *
 * @param accountEmail - Googleアカウントのメールアドレス
 * @returns トークンを含むResult<Option<OAuthTokens>, KeychainError>
 *
 * @example
 * ```typescript
 * const result = await getTokens('user@gmail.com');
 *
 * if (isOk(result) && isSome(result.value)) {
 *   const tokens = result.value.value;
 *   console.log('アクセストークン:', tokens.accessToken);
 * }
 * ```
 */
export async function getTokens(
	accountEmail: string,
): Promise<Result<Option<OAuthTokens>, KeychainError>> {
	const key = getTokenKey(accountEmail);

	try {
		const secret = await keytar.getPassword(KEYCHAIN_SERVICE, key);

		if (secret === null) {
			return ok(none());
		}

		try {
			const stored: StoredTokens = JSON.parse(secret);
			return ok(
				some({
					accessToken: stored.accessToken,
					refreshToken: stored.refreshToken,
					expiresAt: new Date(stored.expiresAt),
				}),
			);
		} catch {
			// JSONパースに失敗した場合は存在しないものとして扱う
			return ok(none());
		}
	} catch (error) {
		return err(mapKeytarError(error, "読み取り"));
	}
}

/**
 * トークンを削除
 *
 * 指定されたアカウントのOAuthトークンをKeychainから削除します。
 * トークンが存在しない場合も成功として扱います。
 *
 * @param accountEmail - Googleアカウントのメールアドレス
 * @returns 成功時はOk(void)、失敗時はErr(KeychainError)
 *
 * @example
 * ```typescript
 * const result = await deleteTokens('user@gmail.com');
 *
 * if (isOk(result)) {
 *   console.log('トークンを削除しました');
 * }
 * ```
 */
export async function deleteTokens(
	accountEmail: string,
): Promise<Result<void, KeychainError>> {
	const key = getTokenKey(accountEmail);

	try {
		// deletePasswordは削除成功時にtrue、存在しない場合はfalseを返す
		// どちらの場合も成功として扱う
		await keytar.deletePassword(KEYCHAIN_SERVICE, key);
		return ok(undefined);
	} catch (error) {
		return err(mapKeytarError(error, "削除"));
	}
}

/**
 * トークンが存在するか確認
 *
 * 指定されたアカウントのOAuthトークンがKeychainに存在するかどうかを確認します。
 *
 * @param accountEmail - Googleアカウントのメールアドレス
 * @returns 存在確認の結果を含むResult<boolean, KeychainError>
 *
 * @example
 * ```typescript
 * const result = await hasTokens('user@gmail.com');
 *
 * if (isOk(result) && result.value) {
 *   console.log('トークンは設定済みです');
 * }
 * ```
 */
export async function hasTokens(
	accountEmail: string,
): Promise<Result<boolean, KeychainError>> {
	const key = getTokenKey(accountEmail);

	try {
		const secret = await keytar.getPassword(KEYCHAIN_SERVICE, key);
		return ok(secret !== null);
	} catch (error) {
		return err(mapKeytarError(error, "確認"));
	}
}

/**
 * トークンが期限切れか確認
 *
 * アクセストークンが期限切れかどうかを判定します。
 * 5分前に期限切れとみなし、リフレッシュの余裕を持たせます。
 *
 * @param tokens - 確認するOAuthトークン
 * @returns 期限切れの場合true
 *
 * @example
 * ```typescript
 * const tokens: OAuthTokens = { ... };
 *
 * if (isTokenExpired(tokens)) {
 *   // リフレッシュトークンを使ってアクセストークンを更新
 * }
 * ```
 */
export function isTokenExpired(tokens: OAuthTokens): boolean {
	// 5分前に期限切れとみなす（リフレッシュの余裕）
	const bufferMs = 5 * 60 * 1000;
	return tokens.expiresAt.getTime() - bufferMs < Date.now();
}
