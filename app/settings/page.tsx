/**
 * 設定トップページ（Server Component）
 *
 * 各種設定ページへのナビゲーションを提供します。
 *
 * @module app/settings/page
 */

import Link from "next/link";
import { css } from "@/styled-system/css";

/**
 * 戻るアイコン（SVG）
 */
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
 * カレンダーアイコン（SVG）
 */
function CalendarIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={css({ width: "5", height: "5" })}
			aria-hidden="true"
		>
			<path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
			<path
				fillRule="evenodd"
				d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * ユーザーアイコン（SVG）
 */
function UserIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={css({ width: "5", height: "5" })}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * 右矢印アイコン（SVG）
 */
function ChevronRightIcon() {
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
				d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/** メニュー項目の定義 */
const menuItems = [
	{
		href: "/settings/calendars",
		icon: CalendarIcon,
		label: "カレンダー設定",
		description: "カレンダーの追加・削除・同期設定",
	},
	{
		href: "/settings/account",
		icon: UserIcon,
		label: "アカウント",
		description: "アカウント情報・ログアウト",
	},
] as const;

/**
 * 設定トップページ
 *
 * 各種設定ページへのナビゲーションメニューを表示します。
 *
 * @returns 設定トップページ要素
 */
export default function SettingsPage() {
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
					href="/"
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
					aria-label="ホームに戻る"
				>
					<BackIcon />
				</Link>
				<h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>設定</h1>
			</header>

			{/* メニュー */}
			<main
				className={css({
					flex: "1",
					p: "6",
					maxWidth: "4xl",
					mx: "auto",
					width: "full",
				})}
			>
				<nav>
					<ul
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "2",
						})}
					>
						{menuItems.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className={css({
										display: "flex",
										alignItems: "center",
										gap: "4",
										p: "4",
										borderRadius: "lg",
										border: "1px solid",
										borderColor: "border.default",
										bg: "bg.default",
										transition: "all 0.15s ease",
										_hover: {
											bg: "bg.muted",
											borderColor: "border.muted",
										},
									})}
								>
									{/* アイコン */}
									<div
										className={css({
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											width: "10",
											height: "10",
											borderRadius: "md",
											bg: "bg.subtle",
											color: "fg.muted",
											flexShrink: "0",
										})}
									>
										<item.icon />
									</div>

									{/* テキスト */}
									<div className={css({ flex: "1" })}>
										<div
											className={css({
												fontWeight: "medium",
												color: "fg.default",
											})}
										>
											{item.label}
										</div>
										<div
											className={css({
												fontSize: "sm",
												color: "fg.muted",
												mt: "0.5",
											})}
										>
											{item.description}
										</div>
									</div>

									{/* 右矢印 */}
									<div
										className={css({
											color: "fg.muted",
											flexShrink: "0",
										})}
									>
										<ChevronRightIcon />
									</div>
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</main>
		</div>
	);
}
