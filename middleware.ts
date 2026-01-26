import { type NextRequest, NextResponse } from "next/server";

/**
 * セットアップ状態に応じてリダイレクトするミドルウェア
 *
 * 未セットアップ状態で / にアクセスした場合、/setup にリダイレクトします。
 */
export async function middleware(request: NextRequest) {
	// /api/setup/check-status を内部呼び出し
	const statusUrl = new URL("/api/setup/check-status", request.url);

	try {
		const response = await fetch(statusUrl);

		if (!response.ok) {
			// APIエラー時はセットアップへ
			return NextResponse.redirect(new URL("/setup", request.url));
		}

		const data = await response.json();

		if (!data.isComplete) {
			// 未セットアップ時は /setup へリダイレクト
			return NextResponse.redirect(new URL("/setup", request.url));
		}
	} catch {
		// エラー時はセットアップへ
		return NextResponse.redirect(new URL("/setup", request.url));
	}

	return NextResponse.next();
}

// マッチャー: / のみ（/setup, /api, /_next, /icons は除外）
export const config = {
	matcher: "/",
};
