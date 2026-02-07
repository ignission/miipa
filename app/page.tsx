import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TodayWeekView } from "@/components/calendar/TodayWeekView";
import { css } from "@/styled-system/css";

/**
 * 設定アイコン（歯車）
 * WCAG AA準拠: 3:1以上のコントラスト比を確保
 * アウトライン版で視認性を向上
 */
function SettingsIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={css({ width: "6", height: "6" })}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * メイン画面
 *
 * セットアップ完了後に表示されるホーム画面です。
 *
 * Server Componentとして動作し、セットアップ状態を直接チェックします。
 * Edge RuntimeではなくNode.js Runtimeで実行されるため、
 * ファイルシステムアクセスやDBアクセスが可能です。
 */
export default async function HomePage() {
	// 認証チェック
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	return (
		<div
			className={css({
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				bg: "bg.canvas",
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
					borderColor: "border.default",
					bg: "bg.default",
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
								color: "fg.default",
							})}
						>
							SoloDay
						</h1>
						<span
							className={css({
								color: "fg.muted",
								fontSize: "xs",
								display: { base: "none", sm: "inline" },
							})}
						>
							30秒で今日を把握
						</span>
					</div>
				</div>

				{/* 右: 設定リンク */}
				{/* WCAG: タッチターゲット44px以上、コントラスト比3:1以上 */}
				<Link
					href="/settings/calendars"
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						// タッチターゲット: 44x44px (WCAG推奨をクリア)
						width: "11",
						height: "11",
						borderRadius: "lg",
						color: "fg.default",
						bg: "bg.subtle",
						border: "1px solid",
						borderColor: "border.default",
						transition: "all 0.2s ease",
						_hover: {
							color: "fg.default",
							bg: "bg.muted",
							borderColor: "border.muted",
							transform: "rotate(45deg)",
						},
						_focusVisible: {
							outline: "3px solid",
							outlineColor: "neutral.9",
							outlineOffset: "2px",
							bg: "bg.muted",
						},
						_active: {
							// アクティブ時: 押下感
							transform: "rotate(45deg) scale(0.95)",
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
					borderColor: "border.default",
				})}
			>
				SoloDay v1.0
			</footer>
		</div>
	);
}
