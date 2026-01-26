import Image from "next/image";
import { css } from "@/styled-system/css";

/**
 * メイン画面
 *
 * セットアップ完了後に表示されるホーム画面です。
 * middlewareで未セットアップ時は /setup にリダイレクトされるため、
 * このページはセットアップ完了後のみ表示されます。
 */
export default function HomePage() {
	return (
		<div
			className={css({
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "4",
				p: "6",
			})}
		>
			{/* ミーアキャットロゴ */}
			<Image
				src="/icons/meerkat-celebration.svg"
				alt="SoloDay"
				width={96}
				height={96}
				className={css({ width: "24", height: "24" })}
			/>

			<h1 className={css({ fontSize: "3xl", fontWeight: "bold" })}>
				SoloDayへようこそ
			</h1>

			<p
				className={css({
					color: "fg.muted",
					textAlign: "center",
					maxWidth: "md",
				})}
			>
				一人社長のための30秒カレンダーAIアシスタント。
				今日と今週の予定を素早く把握できます。
			</p>

			{/* プレースホルダ: 後でカレンダー統合UIに置き換え */}
			<div
				className={css({
					mt: "8",
					p: "8",
					bg: "bg.muted",
					borderRadius: "xl",
					textAlign: "center",
				})}
			>
				<p className={css({ color: "fg.muted" })}>
					カレンダー統合機能は今後実装予定です
				</p>
			</div>
		</div>
	);
}
