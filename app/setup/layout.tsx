/**
 * セットアップ専用レイアウト
 *
 * セットアップフロー用のレイアウトコンポーネントです。
 * ヘッダーとコンテンツ（中央寄せ）の2つのセクションで構成されています。
 *
 * @module app/setup/layout
 */

import type { ReactNode } from "react";
import { css } from "@/styled-system/css";

/**
 * セットアップレイアウト
 *
 * セットアップウィザードの全ページに適用されるレイアウトです。
 * - ヘッダー: ページタイトルを表示
 * - コンテンツ: 中央寄せで最大幅を設定
 *
 * @param props - コンポーネントのProps
 * @param props.children - レイアウト内に表示する子要素
 * @returns セットアップレイアウト要素
 */
export default function SetupLayout({ children }: { children: ReactNode }) {
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
					p: "4",
					borderBottom: "1px solid",
					borderColor: "border.default",
				})}
			>
				<h1 className={css({ fontSize: "xl", fontWeight: "bold" })}>
					SoloDay セットアップ
				</h1>
			</header>

			{/* コンテンツ（中央寄せ） */}
			<main
				className={css({
					flex: "1",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					p: "6",
				})}
			>
				<div
					className={css({
						width: "full",
						maxWidth: "4xl",
					})}
				>
					{children}
				</div>
			</main>
		</div>
	);
}
