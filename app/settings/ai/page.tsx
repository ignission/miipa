/**
 * AI設定ページ（Server Component）
 *
 * AIプロバイダ・モデルの表示・変更を行う設定ページです。
 *
 * @module app/settings/ai/page
 */

import Link from "next/link";
import { AiSettingsClient } from "@/components/settings/AiSettingsClient";
import { css } from "@/styled-system/css";

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
 * AI設定ページ
 *
 * AIプロバイダの変更、APIキー更新、モデル指定を行う設定ページです。
 */
export default function AiSettingsPage() {
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
				<h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>AI設定</h1>
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
				<AiSettingsClient />
			</main>
		</div>
	);
}
