/**
 * ルートページ
 *
 * 認証済みユーザーはダッシュボード(/home)にリダイレクトし、
 * 未認証ユーザーにはランディングページを表示します。
 *
 * Google OAuth審査でホームページにプライバシーポリシーリンクが
 * 必要なため、未認証でもアクセス可能にしています。
 *
 * @module app/page
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LandingPage from "@/components/lp/LandingPage";

/**
 * ルートページ
 *
 * @returns 認証済み: /home へリダイレクト、未認証: ランディングページ
 */
export default async function RootPage() {
	// 認証チェック
	const session = await auth();
	if (session?.user?.id) {
		redirect("/home");
	}

	return <LandingPage />;
}
