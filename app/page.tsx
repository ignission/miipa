import Image from "next/image";
import { TodayWeekView } from "@/components/calendar/TodayWeekView";
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
				background:
					"linear-gradient(180deg, #faf8f5 0%, #f5f0e8 50%, #ebe5d9 100%)",
			})}
		>
			{/* ヘッダー: ミーアキャットロゴとタイトル（コンパクト・横並び） */}
			<header
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "3",
					py: "3",
					px: "4",
					borderBottom: "1px solid",
					borderColor: "sand.4",
					backgroundColor: "rgba(255, 255, 255, 0.6)",
					backdropFilter: "blur(8px)",
				})}
			>
				<Image
					src="/icons/meerkat-celebration.svg"
					alt="SoloDay"
					width={40}
					height={40}
					className={css({ width: "10", height: "10" })}
				/>

				<div
					className={css({
						display: "flex",
						alignItems: "baseline",
						gap: "2",
					})}
				>
					<h1
						className={css({
							fontSize: "xl",
							fontWeight: "bold",
							color: "#1c1917",
						})}
					>
						SoloDay
					</h1>
					<span
						className={css({
							color: "#57534e",
							fontSize: "xs",
							display: { base: "none", sm: "inline" },
						})}
					>
						30秒で今日を把握
					</span>
				</div>
			</header>

			{/* メインコンテンツ: 今日/今週の予定表示 */}
			<main
				className={css({
					width: "100%",
					maxWidth: "2xl",
					mx: "auto",
					flex: "1",
					px: { base: "4", md: "6" },
					py: "4",
				})}
			>
				<TodayWeekView />
			</main>

			{/* フッター */}
			<footer
				className={css({
					py: "3",
					textAlign: "center",
					color: "fg.muted",
					fontSize: "xs",
					borderTop: "1px solid",
					borderColor: "sand.3",
				})}
			>
				SoloDay v1.0
			</footer>
		</div>
	);
}
