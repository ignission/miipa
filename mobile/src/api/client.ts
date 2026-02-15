import {
	getToken,
	saveToken,
	deleteToken,
	deleteUser,
	getRefreshToken,
	saveRefreshToken,
	deleteRefreshToken,
} from "../auth/storage";

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://miipa.app";

/** レスポンスボディが空かどうかを判定する */
function isEmptyBody(response: Response): boolean {
	return (
		response.status === 204 ||
		response.status === 205 ||
		response.headers.get("content-length") === "0"
	);
}

/** リフレッシュ処理の重複実行を防ぐためのロック */
let refreshPromise: Promise<boolean> | null = null;

/**
 * リフレッシュトークンで新しいアクセストークンを取得
 *
 * @returns リフレッシュ成功ならtrue、失敗ならfalse
 */
async function refreshAccessToken(): Promise<boolean> {
	const refreshToken = await getRefreshToken();
	if (!refreshToken) {
		return false;
	}

	try {
		const response = await fetch(
			`${DEFAULT_BASE_URL}/api/auth/mobile/token`,
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
 * 認証付きfetchラッパー
 *
 * - Bearer ヘッダを自動付与
 * - 401エラー時にリフレッシュトークンで自動リトライ
 * - リトライも失敗した場合はトークンを削除（自動ログアウト）
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

	// 401エラー時はリフレッシュトークンで自動リトライ
	if (response.status === 401) {
		// 重複リフレッシュを防止
		if (!refreshPromise) {
			refreshPromise = refreshAccessToken().finally(() => {
				refreshPromise = null;
			});
		}

		const refreshed = await refreshPromise;

		if (refreshed) {
			// リフレッシュ成功: 新しいトークンでリトライ
			const newToken = await getToken();
			const retryHeaders: Record<string, string> = {
				"Content-Type": "application/json",
				...(options.headers as Record<string, string>),
			};
			if (newToken) {
				retryHeaders.Authorization = `Bearer ${newToken}`;
			}

			const retryResponse = await fetch(`${DEFAULT_BASE_URL}${path}`, {
				...options,
				headers: retryHeaders,
			});

			if (!retryResponse.ok) {
				const body = await retryResponse.json().catch(() => null);
				const message =
					body?.error?.message ??
					body?.error ??
					`API エラー: ${retryResponse.status}`;
				throw new ApiError(message, retryResponse.status);
			}

			// 空レスポンスの場合はJSONパースをスキップ
			if (isEmptyBody(retryResponse)) {
				return null as T;
			}

			return retryResponse.json() as Promise<T>;
		}

		// リフレッシュ失敗: ログアウト
		await Promise.all([
			deleteToken(),
			deleteRefreshToken(),
			deleteUser(),
		]);
		throw new ApiError("認証エラー", 401);
	}

	if (!response.ok) {
		const body = await response.json().catch(() => null);
		const message = body?.error?.message ?? body?.error ?? `API エラー: ${response.status}`;
		throw new ApiError(message, response.status);
	}

	// 空レスポンスの場合はJSONパースをスキップ
	if (isEmptyBody(response)) {
		return null as T;
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
