/**
 * アカウント設定ページ（Server Component）
 *
 * ユーザー情報の表示、サインアウト、アカウント削除を提供する設定ページです。
 *
 * @module app/settings/account/page
 */

import Link from "next/link";
import { auth } from "@/auth";
import { css } from "@/styled-system/css";
import { AccountSettingsClient } from "./AccountSettingsClient";

/** 戻るアイコン（SVG） */
function BackIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({ width: "5", height: "5" })}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * アカウント設定ページ
 *
 * ユーザー情報の閲覧、サインアウト、アカウント削除を行う設定ページです。
 */
export default async function AccountSettingsPage() {
	const session = await auth();
	const userName = session?.user?.name ?? "";
	const userEmail = session?.user?.email ?? "";

	return (
		<div
			className={css({
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
			})}
		>
			{/* ヘッダー */}
			<header
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "4",
					p: "4",
					borderBottom: "1px solid",
					borderColor: "border.default",
				})}
			>
				<Link
					href="/settings"
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						p: "2",
						borderRadius: "md",
						color: "fg.muted",
						transition: "all 0.15s ease",
						_hover: {
							bg: "bg.muted",
							color: "fg.default",
						},
					})}
					aria-label="設定に戻る"
				>
					<BackIcon />
				</Link>
				<h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
					アカウント
				</h1>
			</header>

			{/* コンテンツ */}
			<main
				className={css({
					flex: "1",
					p: "6",
					maxWidth: "4xl",
					mx: "auto",
					width: "full",
				})}
			>
				<AccountSettingsClient userName={userName} userEmail={userEmail} />
			</main>
		</div>
	);
}
