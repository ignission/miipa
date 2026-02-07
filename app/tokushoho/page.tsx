/**
 * 特定商取引法に基づく表記ページ（Server Component）
 *
 * 特定商取引法に基づく事業者情報をテーブル形式で表示するページです。
 * プライバシーポリシー・利用規約ページと同じレイアウトパターンを使用しています。
 *
 * @module app/tokushoho/page
 */

import type { Metadata } from "next";
import { BackButton } from "@/components/ui/BackButton";
import { css } from "@/styled-system/css";

export const metadata: Metadata = {
	title: "miipa | 特定商取引法に基づく表記",
};

/** テーブルに表示する項目の型 */
type TableRow = {
	label: string;
	value: string;
};

/** 特定商取引法に基づく表記の項目一覧 */
const rows: TableRow[] = [
	{ label: "事業者", value: "合同会社Ignission" },
	{ label: "運営責任者", value: "西立野 翔磨" },
	{
		label: "所在地",
		value:
			"〒103-0007 東京都中央区日本橋浜町三丁目19番4号 WAVES日本橋浜町 1201",
	},
	{ label: "連絡先", value: "miipa@ignission.tech" },
	{ label: "販売価格", value: "無料" },
	{
		label: "提供時期",
		value: "アカウント登録後すぐにご利用いただけます",
	},
	{ label: "支払方法", value: "該当なし（無料サービス）" },
	{
		label: "返品・解約",
		value: "マイページからいつでもアカウントを削除できます",
	},
	{ label: "推奨環境", value: "Chrome / Safari / Edge 最新版" },
];

/**
 * 特定商取引法に基づく表記ページ
 *
 * 事業者情報をテーブル形式で中央寄せカードレイアウトに表示します。
 *
 * @returns 特定商取引法に基づく表記ページ要素
 */
export default function TokushohoPage() {
	const tableStyle = css({
		width: "full",
		fontSize: "sm",
	});

	const rowStyle = css({
		display: "flex",
		borderBottom: "1px solid",
		borderColor: "border.default",
		py: "3",
	});

	const labelStyle = css({
		width: "40%",
		fontWeight: "medium",
		color: "fg.default",
		flexShrink: 0,
	});

	const valueStyle = css({
		color: "fg.muted",
		lineHeight: "relaxed",
	});

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				bg: "bg.canvas",
				p: "4",
			})}
		>
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "6",
					p: "8",
					bg: "bg.default",
					borderRadius: "xl",
					border: "1px solid",
					borderColor: "border.default",
					boxShadow: "lg",
					maxWidth: "2xl",
					width: "full",
				})}
			>
				{/* 前のページに戻る */}
				<BackButton />

				{/* タイトル */}
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "1",
					})}
				>
					<h1
						className={css({
							fontSize: "2xl",
							fontWeight: "bold",
							color: "fg.default",
						})}
					>
						特定商取引法に基づく表記
					</h1>
					<p className={css({ color: "fg.muted", fontSize: "xs" })}>
						最終更新日: 2026年2月8日
					</p>
				</div>

				{/* 事業者情報テーブル */}
				<div className={tableStyle}>
					{rows.map((row) => (
						<div key={row.label} className={rowStyle}>
							<div className={labelStyle}>{row.label}</div>
							<div className={valueStyle}>{row.value}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
