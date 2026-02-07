/**
 * Google OAuth 認証開始 API エンドポイント
 *
 * Google Calendar の OAuth 認証フローを開始します。
 * PKCE方式で認証URLを生成し、code_verifier を Cookie に保存します。
 *
 * @endpoint POST /api/calendars/google
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/calendars/google', { method: 'POST' });
 * const data = await response.json();
 *
 * // 成功レスポンス
 * // {
 * //   authUrl: "https://accounts.google.com/o/oauth2/v2/auth?..."
 * // }
 *
 * // エラーレスポンス (401)
 * // {
 * //   error: { code: 'UNAUTHORIZED', message: '認証が必要です' }
 * // }
 *
 * // エラーレスポンス (500)
 * // {
 * //   error: { code: 'AUTH_URL_GENERATION_FAILED', message: '認証URLの生成に失敗しました' }
 * // }
 * ```
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { startGoogleAuth } from "@/lib/application/calendar";
import { isOk } from "@/lib/domain/shared";

/** code_verifier を保存する Cookie 名（コールバックと共通） */
const CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";

/** Cookie の有効期限（10分） */
const COOKIE_MAX_AGE = 60 * 10;

/**
 * Google OAuth 認証を開始する
 *
 * @param request - リクエスト（オプションで loginHint を含む）
 * @returns 認証URL
 */
export async function POST(request: Request) {
	// 認証チェック
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json(
			{
				error: {
					code: "UNAUTHORIZED",
					message: "認証が必要です",
				},
			},
			{ status: 401 },
		);
	}

	// リクエストボディからオプションの loginHint を取得（後方互換性のため空ボディも許容）
	let loginHint: string | undefined;
	try {
		const body = (await request.json()) as { loginHint?: string };
		loginHint = body.loginHint;
	} catch {
		// ボディが空または不正な場合は loginHint なしで続行
	}

	const result = await startGoogleAuth(loginHint);

	if (isOk(result)) {
		const { url, codeVerifier } = result.value;

		// code_verifier を Cookie に保存
		const cookieStore = await cookies();
		cookieStore.set(CODE_VERIFIER_COOKIE, codeVerifier, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: COOKIE_MAX_AGE,
			path: "/",
		});

		return NextResponse.json({
			authUrl: url,
		});
	}

	// エラー時は500を返す
	return NextResponse.json(
		{ error: { code: result.error.code, message: result.error.message } },
		{ status: 500 },
	);
}
