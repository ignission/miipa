import { Platform } from "react-native";
import { AUTH_CONFIG } from "../auth/config";
import {
	deleteRefreshToken,
	deleteToken,
	deleteUser,
	getRefreshToken,
	getToken,
	saveRefreshToken,
	saveToken,
} from "../auth/storage";

/**
 * APIベースURL
 *
 * Web: 環境変数または空文字列（同一オリジンの場合）
 * Mobile: 環境変数または本番URL
 */
const API_BASE_URL = AUTH_CONFIG.apiBaseUrl;

/** レスポンスボディが空かどうかを判定する */
function isEmptyBody(response: Response): boolean {
	return (
		response.status === 204 ||
		response.status === 205 ||
		response.headers.get("content-length") === "0"
	);
}

/**
 * トークン付きのリクエストヘッダーを構築する
 */
function buildHeaders(
	baseHeaders: Record<string, string> | undefined,
	token: string | null,
): Record<string, string> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(baseHeaders as Record<string, string>),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
}

/**
 * レスポンスのエラーチェックとJSONパースを行う
 *
 * @throws {ApiError} レスポンスがエラーの場合
 */
async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		const message =
			body?.error?.message ?? body?.error ?? `API エラー: ${response.status}`;
		throw new ApiError(message, response.status);
	}

	if (isEmptyBody(response)) {
		return null as T;
	}

	return response.json() as Promise<T>;
}

/** リフレッシュ処理の重複実行を防ぐためのロック */
let refreshPromise: Promise<boolean> | null = null;

/**
 * リフレッシュトークンで新しいアクセストークンを取得
 *
 * Web: Cookie ベースのリフレッシュ（/auth/refresh）
 * Mobile: Body にリフレッシュトークンを含めて送信（/auth/mobile/token）
 *
 * @returns リフレッシュ成功ならtrue、失敗ならfalse
 */
async function refreshAccessToken(): Promise<boolean> {
	if (Platform.OS === "web") {
		// Web: httpOnly Cookie を自動送信してリフレッシュ
		try {
			const response = await fetch(
				`${API_BASE_URL}${AUTH_CONFIG.refreshEndpoint}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({}),
				},
			);

			if (!response.ok) {
				return false;
			}

			const data = (await response.json()) as {
				token: string;
				user: {
					id: string;
					name: string | null;
					email: string;
					image: string | null;
				};
			};

			// メモリにアクセストークンを保存（Cookie は Hono が管理）
			await saveToken(data.token);

			return true;
		} catch {
			return false;
		}
	}

	// Mobile: SecureStore のリフレッシュトークンを使用
	const refreshToken = await getRefreshToken();
	if (!refreshToken) {
		return false;
	}

	try {
		const response = await fetch(
			`${API_BASE_URL}${AUTH_CONFIG.tokenEndpoint}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					grantType: "refresh_token",
					refreshToken,
				}),
			},
		);

		if (!response.ok) {
			return false;
		}

		const data = (await response.json()) as {
			token: string;
			refreshToken: string;
		};

		await Promise.all([
			saveToken(data.token),
			saveRefreshToken(data.refreshToken),
		]);

		return true;
	} catch {
		return false;
	}
}

/**
 * プラットフォームに応じた fetch オプションを構築
 *
 * Web: credentials: "include" で httpOnly Cookie を自動送信
 * 共通: Bearer ヘッダを付与（メモリ/SecureStore のトークン使用）
 */
function buildFetchOptions(
	options: RequestInit,
	headers: Record<string, string>,
): RequestInit {
	const base: RequestInit = {
		...options,
		headers,
	};

	if (Platform.OS === "web") {
		base.credentials = "include";
	}

	return base;
}

/**
 * トークン付きのリクエストを実行する
 */
async function executeRequest(
	path: string,
	options: RequestInit,
	token: string | null,
): Promise<Response> {
	const headers = buildHeaders(
		options.headers as Record<string, string>,
		token,
	);
	const fetchOptions = buildFetchOptions(options, headers);
	return fetch(`${API_BASE_URL}${path}`, fetchOptions);
}

/**
 * 認証付きfetchラッパー
 *
 * - Bearer ヘッダを自動付与
 * - Web: credentials: "include" で Cookie も自動送信
 * - 401エラー時にリフレッシュトークンで自動リトライ
 * - リトライも失敗した場合はトークンを削除（自動ログアウト）
 */
export async function apiFetch<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const token = await getToken();
	const response = await executeRequest(path, options, token);

	// 401以外はそのままレスポンス処理
	if (response.status !== 401) {
		return handleResponse<T>(response);
	}

	// 401エラー時はリフレッシュトークンで自動リトライ（重複防止）
	if (!refreshPromise) {
		refreshPromise = refreshAccessToken().finally(() => {
			refreshPromise = null;
		});
	}

	const refreshed = await refreshPromise;

	if (!refreshed) {
		// リフレッシュ失敗: ログアウト
		await Promise.all([deleteToken(), deleteRefreshToken(), deleteUser()]);
		throw new ApiError("認証エラー", 401);
	}

	// リフレッシュ成功: 新しいトークンでリトライ
	const newToken = await getToken();
	const retryResponse = await executeRequest(path, options, newToken);
	return handleResponse<T>(retryResponse);
}

/**
 * APIエラー
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}
