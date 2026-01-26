/**
 * Google OAuth コールバック API エンドポイント
 *
 * Google OAuth 認証フローのコールバックを処理します。
 * 認証コードを受け取り、トークンに交換してカレンダーを設定に追加します。
 *
 * @endpoint GET /api/auth/google/callback
 *
 * @example
 * ```
 * // Google OAuth からのリダイレクト
 * GET /api/auth/google/callback?code=xxx&state=xxx
 *
 * // 成功時: /setup?calendar=success にリダイレクト
 * // 失敗時: /setup?calendar=error&message=xxx にリダイレクト
 * ```
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { completeGoogleAuth } from "@/lib/application/calendar";
import { isOk } from "@/lib/domain/shared";

/** code_verifier を保存する Cookie 名 */
const CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";

/**
 * Google OAuth コールバックを処理する
 *
 * @param request - Next.js リクエストオブジェクト
 * @returns セットアップページへのリダイレクトレスポンス
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const _state = searchParams.get("state");
	const error = searchParams.get("error");

	// Google から エラーが返された場合
	if (error) {
		const errorDescription =
			searchParams.get("error_description") || "認証がキャンセルされました";
		return redirectToSetupWithError(errorDescription);
	}

	// 認証コードがない場合
	if (!code) {
		return redirectToSetupWithError("認証コードが見つかりません");
	}

	// Cookie から code_verifier を取得
	const cookieStore = await cookies();
	const codeVerifier = cookieStore.get(CODE_VERIFIER_COOKIE)?.value;

	if (!codeVerifier) {
		return redirectToSetupWithError(
			"認証セッションが無効です。もう一度お試しください。",
		);
	}

	// 認証を完了し、カレンダーを追加
	const result = await completeGoogleAuth(code, codeVerifier);

	// code_verifier Cookie を削除
	const response = isOk(result)
		? redirectToSetupWithSuccess()
		: redirectToSetupWithError(result.error.message);

	// Cookie を削除するために Response を変更
	response.cookies.delete(CODE_VERIFIER_COOKIE);

	return response;
}

/**
 * 成功時のリダイレクトレスポンスを生成
 */
function redirectToSetupWithSuccess(): NextResponse {
	return NextResponse.redirect(
		new URL(
			"/setup?calendar=success",
			process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
		),
	);
}

/**
 * エラー時のリダイレクトレスポンスを生成
 *
 * @param message - エラーメッセージ
 */
function redirectToSetupWithError(message: string): NextResponse {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const url = new URL("/setup", baseUrl);
	url.searchParams.set("calendar", "error");
	url.searchParams.set("message", message);
	return NextResponse.redirect(url);
}
