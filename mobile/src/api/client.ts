import { getToken, deleteToken, deleteUser } from "../auth/storage";

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://miipa.app";

/**
 * 認証付きfetchラッパー
 *
 * - Bearer ヘッダを自動付与
 * - 401エラー時にトークンを削除（自動ログアウト）
 */
export async function apiFetch<T>(
	path: string,
	options: RequestInit = {},
): Promise<T> {
	const token = await getToken();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string>),
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
		...options,
		headers,
	});

	// 401エラー時は自動ログアウト
	if (response.status === 401) {
		await Promise.all([deleteToken(), deleteUser()]);
		throw new ApiError("認証エラー", 401);
	}

	if (!response.ok) {
		const body = await response.json().catch(() => null);
		const message = body?.error?.message ?? body?.error ?? `API エラー: ${response.status}`;
		throw new ApiError(message, response.status);
	}

	return response.json() as Promise<T>;
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
