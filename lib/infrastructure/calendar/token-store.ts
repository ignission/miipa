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
 * import { D1SecretRepository } from '@/lib/infrastructure/secret/d1-secret-repository';
 *
 * const secretRepo = new D1SecretRepository(db, userId, encryptionKey);
 *
 * // トークンを保存
 * await saveTokens(secretRepo, 'user@gmail.com', {
 *   accessToken: 'ya29.xxx',
 *   refreshToken: '1//xxx',
 *   expiresAt: new Date(Date.now() + 3600 * 1000),
 * });
 *
 * // トークンを取得
 * const result = await getTokens(secretRepo, 'user@gmail.com');
 * if (result._tag === 'Ok' && result.value._tag === 'Some') {
 *   const tokens = result.value.value;
 *   if (isTokenExpired(tokens)) {
 *     // リフレッシュ処理
 *   }
 * }
 * ```
 */

import { none, type Option, ok, type Result, some } from "@/lib/domain/shared";
import type { D1SecretRepository } from "@/lib/infrastructure/secret/d1-secret-repository";
import {
	createGoogleOAuthKey,
	type SecretError,
} from "@/lib/infrastructure/secret/types";

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
// トークン操作関数
// ============================================================

/**
 * トークンを保存
 *
 * 指定されたアカウントのOAuthトークンをSQLiteに暗号化して保存します。
 * 同じアカウントのトークンが既に存在する場合は上書きします。
 *
 * @param secretRepo - D1SecretRepositoryインスタンス
 * @param accountEmail - Googleアカウントのメールアドレス
 * @param tokens - 保存するOAuthトークン
 * @returns 成功時はOk(void)、失敗時はErr(SecretError)
 *
 * @example
 * ```typescript
 * const result = await saveTokens(secretRepo, 'user@gmail.com', {
 *   accessToken: 'ya29.xxx',
 *   refreshToken: '1//xxx',
 *   expiresAt: new Date(Date.now() + 3600 * 1000),
 * });
 *
 * if (result._tag === 'Ok') {
 *   console.log('トークンを保存しました');
 * }
 * ```
 */
export async function saveTokens(
	secretRepo: D1SecretRepository,
	accountEmail: string,
	tokens: OAuthTokens,
): Promise<Result<void, SecretError>> {
	const key = createGoogleOAuthKey(accountEmail);
	const stored: StoredTokens = {
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken,
		expiresAt: tokens.expiresAt.toISOString(),
	};

	return secretRepo.setSecret(key, JSON.stringify(stored));
}

/**
 * トークンを取得
 *
 * 指定されたアカウントのOAuthトークンをSQLiteから取得し復号化します。
 * トークンが存在しない場合は `Ok(None)` を返します。
 * トークンのパースに失敗した場合も `Ok(None)` を返します（破損データとして扱う）。
 *
 * @param secretRepo - D1SecretRepositoryインスタンス
 * @param accountEmail - Googleアカウントのメールアドレス
 * @returns トークンを含むResult<Option<OAuthTokens>, SecretError>
 *
 * @example
 * ```typescript
 * const result = await getTokens(secretRepo, 'user@gmail.com');
 *
 * if (result._tag === 'Ok' && result.value._tag === 'Some') {
 *   const tokens = result.value.value;
 *   console.log('アクセストークン:', tokens.accessToken);
 * }
 * ```
 */
export async function getTokens(
	secretRepo: D1SecretRepository,
	accountEmail: string,
): Promise<Result<Option<OAuthTokens>, SecretError>> {
	const key = createGoogleOAuthKey(accountEmail);

	const result = await secretRepo.getSecret(key);

	if (result._tag === "Err") {
		return result;
	}

	const secretValue = result.value;

	// D1SecretRepositoryのgetSecretはnullを返す（旧版はOption型）
	if (secretValue === null) {
		return ok(none());
	}

	try {
		const stored: StoredTokens = JSON.parse(secretValue);
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
}

/**
 * トークンを削除
 *
 * 指定されたアカウントのOAuthトークンをSQLiteから削除します。
 * トークンが存在しない場合も成功として扱います。
 *
 * @param secretRepo - D1SecretRepositoryインスタンス
 * @param accountEmail - Googleアカウントのメールアドレス
 * @returns 成功時はOk(void)、失敗時はErr(SecretError)
 *
 * @example
 * ```typescript
 * const result = await deleteTokens(secretRepo, 'user@gmail.com');
 *
 * if (result._tag === 'Ok') {
 *   console.log('トークンを削除しました');
 * }
 * ```
 */
export async function deleteTokens(
	secretRepo: D1SecretRepository,
	accountEmail: string,
): Promise<Result<void, SecretError>> {
	const key = createGoogleOAuthKey(accountEmail);

	return secretRepo.deleteSecret(key);
}

/**
 * トークンが存在するか確認
 *
 * 指定されたアカウントのOAuthトークンがSQLiteに存在するかどうかを確認します。
 *
 * @param secretRepo - D1SecretRepositoryインスタンス
 * @param accountEmail - Googleアカウントのメールアドレス
 * @returns 存在確認の結果を含むResult<boolean, SecretError>
 *
 * @example
 * ```typescript
 * const result = await hasTokens(secretRepo, 'user@gmail.com');
 *
 * if (result._tag === 'Ok' && result.value) {
 *   console.log('トークンは設定済みです');
 * }
 * ```
 */
export async function hasTokens(
	secretRepo: D1SecretRepository,
	accountEmail: string,
): Promise<Result<boolean, SecretError>> {
	const key = createGoogleOAuthKey(accountEmail);

	return secretRepo.hasSecret(key);
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
