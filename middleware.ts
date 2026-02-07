import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * 認証ミドルウェア
 *
 * auth.config.ts の軽量設定を使用してセッションチェックを行う。
 * auth.ts（重い依存を含む）はimportしない。
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
	if (!req.auth) {
		// ルートパスは未認証でもアクセス許可（LP表示）
		if (req.nextUrl.pathname === "/") {
			return NextResponse.next();
		}
		const signInUrl = new URL("/auth/signin", req.url);
		return NextResponse.redirect(signInUrl);
	}
	return NextResponse.next();
});

export const config = {
	matcher: [
		// 以下のパスを除外:
		// - /api/auth/* (Auth.jsエンドポイント)
		// - /auth/* (認証ページ)
		// - /privacy/* (プライバシーポリシー)
		// - /terms/* (利用規約)
		// - /tokushoho/* (特定商取引法に基づく表記)
		// - /_next/static/* (静的ファイル)
		// - /_next/image/* (画像最適化)
		// - /favicon.ico
		// - /icons/* (PWAアイコン)
		// - /manifest.json
		// - /sw.js (Service Worker)
		"/((?!api/auth|auth|privacy|terms|tokushoho|_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js).*)",
	],
};
