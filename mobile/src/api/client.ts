import { Platform } from "react-native";
import { AUTH_CONFIG } from "../auth/config";
import { getToken } from "../auth/storage";
import { clearAllTokens, refreshTokens } from "../auth/token";

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
async function handleResponse<T>(response: Response): Promise<T | null> {
	if (!response.ok) {
		const body = await response.json().catch(() => null);
		const message =
			body?.error?.message ?? body?.error ?? `API エラー: ${response.status}`;
		throw new ApiError(message, response.status);
	}

	if (isEmptyBody(response)) {
		return null;
	}

	return response.json() as Promise<T>;
}

/** リフレッシュ処理の重複実行を防ぐためのロック */
let refreshPromise: Promise<boolean> | null = null;

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
): Promise<T | null> {
	const token = await getToken();
	const response = await executeRequest(path, options, token);

	// 401以外はそのままレスポンス処理
	if (response.status !== 401) {
		return handleResponse<T>(response);
	}

	// 401エラー時はリフレッシュトークンで自動リトライ（重複防止）
	if (!refreshPromise) {
		refreshPromise = refreshTokens().finally(() => {
			refreshPromise = null;
		});
	}

	const refreshed = await refreshPromise;

	if (!refreshed) {
		// リフレッシュ失敗: ログアウト
		await clearAllTokens();
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
