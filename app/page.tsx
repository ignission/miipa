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
				alignItems: "center",
				gap: "4",
				p: "6",
			})}
		>
			{/* ヘッダー: ミーアキャットロゴとタイトル */}
			<header
				className={css({
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "2",
					pt: "4",
					pb: "2",
				})}
			>
				<Image
					src="/icons/meerkat-celebration.svg"
					alt="SoloDay"
					width={64}
					height={64}
					className={css({ width: "16", height: "16" })}
				/>

				<h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>
					SoloDay
				</h1>

				<p
					className={css({
						color: "fg.muted",
						textAlign: "center",
						maxWidth: "md",
						fontSize: "sm",
					})}
				>
					今日と今週の予定を30秒で把握
				</p>
			</header>

			{/* メインコンテンツ: 今日/今週の予定表示 */}
			<main
				className={css({
					width: "100%",
					maxWidth: "2xl",
					flex: "1",
				})}
			>
				<TodayWeekView />
			</main>
		</div>
	);
}
