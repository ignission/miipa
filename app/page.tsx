import Image from "next/image";
import Link from "next/link";
import { TodayWeekView } from "@/components/calendar/TodayWeekView";
import { css } from "@/styled-system/css";

/**
 * 設定アイコン（歯車）
 */
function SettingsIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={css({ width: "5", height: "5" })}
			aria-hidden="true"
		>
			<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

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
			{/* ヘッダー: ロゴ・タイトル（左）、設定（右） */}
			<header
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					py: "3",
					px: "4",
					borderBottom: "1px solid",
					borderColor: "sand.4",
					backgroundColor: "rgba(255, 255, 255, 0.6)",
					backdropFilter: "blur(8px)",
				})}
			>
				{/* 左: ロゴとタイトル */}
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "3",
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
				</div>

				{/* 右: 設定リンク */}
				<Link
					href="/settings/calendars"
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						p: "2",
						borderRadius: "lg",
						color: "#1c1917",
						transition: "all 0.2s ease",
						_hover: {
							color: "#b45309",
							backgroundColor: "rgba(180, 83, 9, 0.1)",
							transform: "rotate(45deg)",
						},
						_focusVisible: {
							outline: "3px solid #f59e0b",
							outlineOffset: "2px",
						},
					})}
					aria-label="カレンダー設定"
				>
					<SettingsIcon />
				</Link>
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
