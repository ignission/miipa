/**
 * カレンダー設定ページ（Server Component）
 *
 * カレンダー管理UIのエントリーポイントとなるServer Componentです。
 * カレンダー一覧の表示、追加、削除、同期機能を提供します。
 *
 * @module app/settings/calendars/page
 *
 * @example
 * ブラウザで /settings/calendars にアクセスするとカレンダー設定画面が表示されます。
 */

import Link from "next/link";
import { Suspense } from "react";
import { CalendarsClientWrapper } from "@/components/calendar";
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
 * ローディングフォールバック
 */
function CalendarsLoading() {
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				py: "12",
				color: "fg.muted",
			})}
		>
			読み込み中...
		</div>
	);
}

/**
 * カレンダー設定ページ
 *
 * カレンダーの管理（一覧表示、追加、削除、同期）を行う設定ページです。
 *
 * @returns カレンダー設定ページ要素
 */
export default function CalendarsSettingsPage() {
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
				<h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
					カレンダー設定
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
				<Suspense fallback={<CalendarsLoading />}>
					<CalendarsClientWrapper />
				</Suspense>
			</main>
		</div>
	);
}
