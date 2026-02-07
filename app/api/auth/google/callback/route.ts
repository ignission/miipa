/**
 * Google OAuth コールバック API エンドポイント
 *
 * Google OAuth 認証フローのコールバックを処理します。
 * 認証コードを受け取り、トークンに交換してカレンダーを設定に追加します。
 *
 * @endpoint GET /api/auth/google/callback
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { completeGoogleAuth } from "@/lib/application/calendar";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/** code_verifier を保存する Cookie 名 */
const CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";

/**
 * Google OAuth コールバックを処理する
 *
 * @param request - Next.js リクエストオブジェクト
 * @returns セットアップページへのリダイレクトレスポンス
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const _state = searchParams.get("state");
		const error = searchParams.get("error");

		// Google から エラーが返された場合
		if (error) {
			const errorDescription =
				searchParams.get("error_description") || "認証がキャンセルされました";
			return redirectToCalendarsWithError(errorDescription);
		}

		// 認証コードがない場合
		if (!code) {
			return redirectToCalendarsWithError("認証コードが見つかりません");
		}

		// Cookie から code_verifier を取得
		console.log("[Google OAuth Callback] step: cookies");
		const cookieStore = await cookies();
		const codeVerifier = cookieStore.get(CODE_VERIFIER_COOKIE)?.value;

		if (!codeVerifier) {
			return redirectToCalendarsWithError(
				"認証セッションが無効です。もう一度お試しください。",
			);
		}

		// 認証チェック
		console.log("[Google OAuth Callback] step: auth");
		const session = await auth();
		if (!session?.user?.id) {
			return redirectToCalendarsWithError(
				"認証が必要です。ログインしてください。",
			);
		}

		// D1コンテキスト作成
		console.log("[Google OAuth Callback] step: context");
		const dbResult = getD1Database();
		if (!isOk(dbResult)) {
			return redirectToCalendarsWithError("データベース接続エラー");
		}
		const keyResult = getEncryptionKey();
		if (!isOk(keyResult)) {
			return redirectToCalendarsWithError("暗号化キー取得エラー");
		}
		const cryptoKeyResult = await importEncryptionKey(keyResult.value);
		if (!isOk(cryptoKeyResult)) {
			return redirectToCalendarsWithError("暗号化キーインポートエラー");
		}
		const ctx = createCalendarContext(
			dbResult.value,
			session.user.id,
			cryptoKeyResult.value,
		);

		// 認証を完了し、カレンダーを追加
		console.log("[Google OAuth Callback] step: completeGoogleAuth");
		const result = await completeGoogleAuth(ctx, code, codeVerifier);

		if (!isOk(result)) {
			console.error(
				"[Google OAuth Callback] completeGoogleAuth error:",
				JSON.stringify(result.error, null, 2),
			);
		} else {
			console.log(
				`[Google OAuth Callback] success: ${result.value.addedCalendars.length} calendars added`,
			);
		}

		// code_verifier Cookie を削除
		const response = isOk(result)
			? redirectToCalendarsWithSuccess()
			: redirectToCalendarsWithError(result.error.message);

		response.cookies.delete(CODE_VERIFIER_COOKIE);

		return response;
	} catch (error) {
		console.error("[Google OAuth Callback] unhandled error:", error);
		return redirectToCalendarsWithError("予期しないエラーが発生しました");
	}
}

/**
 * 成功時のリダイレクトレスポンスを生成
 */
function redirectToCalendarsWithSuccess(): NextResponse {
	return NextResponse.redirect(
		new URL(
			"/settings/calendars?calendar=success",
			process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
		),
	);
}

/**
 * エラー時のリダイレクトレスポンスを生成
 *
 * @param message - エラーメッセージ
 */
function redirectToCalendarsWithError(message: string): NextResponse {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const url = new URL("/settings/calendars", baseUrl);
	url.searchParams.set("calendar", "error");
	url.searchParams.set("message", message);
	return NextResponse.redirect(url);
}
