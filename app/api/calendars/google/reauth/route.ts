/**
 * Google OAuth 再認証エンドポイント
 *
 * ブラウザで直接アクセスして再認証フローを開始する。
 * code_verifier を Cookie に設定し、Google 認証画面にリダイレクトする。
 *
 * @endpoint GET /api/calendars/google/reauth?email=user@example.com
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { startGoogleAuth } from "@/lib/application/calendar";
import { isOk } from "@/lib/domain/shared";

/** code_verifier を保存する Cookie 名（コールバックと共通） */
const CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";

/** Cookie の有効期限（10分） */
const COOKIE_MAX_AGE = 60 * 10;

/**
 * Google OAuth 再認証を開始する
 *
 * @param request - GETリクエスト（email クエリパラメータ必須）
 * @returns Google 認証画面へのリダイレクト
 */
export async function GET(request: NextRequest) {
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

	const email = request.nextUrl.searchParams.get("email");

	// email が未指定の場合は 400 エラー
	if (!email) {
		return NextResponse.json(
			{
				error: {
					code: "MISSING_EMAIL",
					message: "email クエリパラメータは必須です",
				},
			},
			{ status: 400 },
		);
	}

	const result = await startGoogleAuth(email);

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

		// Google 認証画面にリダイレクト
		return NextResponse.redirect(url);
	}

	// エラー時は 500 を返す
	return NextResponse.json(
		{ error: { code: result.error.code, message: result.error.message } },
		{ status: 500 },
	);
}
