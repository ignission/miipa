import { Platform } from "react-native";
import { AUTH_CONFIG } from "./config";
import type { StoredUser } from "./storage";
import {
	deleteRefreshToken,
	deleteToken,
	deleteUser,
	getRefreshToken,
	saveRefreshToken,
	saveToken,
	saveUser,
} from "./storage";

/** Web リフレッシュレスポンス */
interface WebRefreshResponse {
	token: string;
	user: StoredUser;
}

/** Mobile リフレッシュレスポンス */
interface MobileRefreshResponse {
	token: string;
	refreshToken: string;
	user: StoredUser;
}

/** トークン・リフレッシュトークン・ユーザー情報を一括削除する */
export async function clearAllTokens(): Promise<void> {
	await Promise.all([deleteToken(), deleteRefreshToken(), deleteUser()]);
}

/**
 * Web用: Cookie ベースでリフレッシュトークンを送信し、新しいアクセストークンを取得
 *
 * httpOnly Cookie を自動送信してリフレッシュエンドポイントを呼び出す。
 * 成功時はアクセストークンとユーザー情報をメモリに保存する。
 */
async function refreshTokensOnWeb(): Promise<boolean> {
	try {
		const res = await fetch(
			`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.refreshEndpoint}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({}),
			},
		);

		if (!res.ok) return false;

		const data = (await res.json()) as WebRefreshResponse;
		await Promise.all([saveToken(data.token), saveUser(data.user)]);
		return true;
	} catch {
		return false;
	}
}

/**
 * Mobile用: SecureStore のリフレッシュトークンで新しいアクセストークンを取得
 *
 * SecureStore からリフレッシュトークンを取得し、トークンエンドポイントに送信する。
 * 成功時はアクセストークン・リフレッシュトークン・ユーザー情報を SecureStore に保存する。
 */
async function refreshTokensOnMobile(): Promise<boolean> {
	const refreshToken = await getRefreshToken();
	if (!refreshToken) return false;

	try {
		const res = await fetch(
			`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.tokenEndpoint}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					grantType: "refresh_token",
					refreshToken,
				}),
			},
		);

		if (!res.ok) return false;

		const data = (await res.json()) as MobileRefreshResponse;
		await Promise.all([
			saveToken(data.token),
			saveRefreshToken(data.refreshToken),
			saveUser(data.user),
		]);
		return true;
	} catch {
		return false;
	}
}

/**
 * プラットフォームに応じたリフレッシュ処理を実行
 *
 * Web: Cookie ベースのリフレッシュ（/auth/refresh）
 * Mobile: SecureStore のリフレッシュトークンを使用（/auth/mobile/token）
 *
 * @returns リフレッシュ成功なら true、失敗なら false
 */
export async function refreshTokens(): Promise<boolean> {
	return Platform.OS === "web"
		? refreshTokensOnWeb()
		: refreshTokensOnMobile();
}
