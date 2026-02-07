/**
 * ランディングページ共通コンポーネント（Server Component）
 *
 * miipa の魅力を伝えるLPとして機能し、
 * Google OAuthサインインへ誘導します。
 *
 * app/page.tsx（未認証時）と app/auth/signin/page.tsx の両方で使用されます。
 *
 * @module components/lp/LandingPage
 */

import Image from "next/image";
import Link from "next/link";
import { signIn } from "@/auth";
import { css } from "@/styled-system/css";

/**
 * Googleサインイン Server Action
 */
async function handleGoogleSignIn() {
	"use server";
	await signIn("google", { redirectTo: "/home" });
}

/** プライマリCTAボタンのスタイル */
const ctaButtonStyle = css({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	gap: "3",
	px: "8",
	py: "4",
	bg: "#C8893A",
	color: "white",
	borderRadius: "xl",
	fontWeight: "bold",
	fontSize: "lg",
	cursor: "pointer",
	transition: "all 0.2s",
	boxShadow: "0 4px 14px rgba(200, 137, 58, 0.3)",
	_hover: {
		bg: "#B07830",
		transform: "translateY(-1px)",
		boxShadow: "0 6px 20px rgba(200, 137, 58, 0.4)",
	},
});

/** セクション共通ラッパーのスタイルオブジェクト */
const sectionBaseStyle = {
	width: "full",
	maxWidth: "5xl",
	mx: "auto",
	px: { base: "6", md: "8" },
} as const;

/** セクション共通ラッパーのクラス名 */
const sectionStyle = css(sectionBaseStyle);

/**
 * ランディングページ
 *
 * Hero、特徴、使い方、CTA、フッターの5セクションで構成。
 * 一人社長向けカレンダー統合AIアシスタント miipa の価値を伝え、
 * Googleサインインへ誘導します。
 *
 * @returns ランディングページ要素
 */
export default function LandingPage() {
	return (
		<div
			className={css({
				minHeight: "100vh",
				bg: "bg.canvas",
				color: "fg.default",
				display: "flex",
				flexDirection: "column",
			})}
		>
			{/* ===== セクション1: Hero ===== */}
			<section
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: { base: "auto", md: "90vh" },
					py: { base: "20", md: "24" },
				})}
			>
				<div
					className={css({
						...sectionBaseStyle,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						textAlign: "center",
						gap: "8",
					})}
				>
					{/* ロゴ */}
					<Image
						src="/icons/logo-256.png"
						alt="miipa ミーアキャット"
						width={128}
						height={128}
						className={css({
							width: { base: "24", md: "32" },
							height: { base: "24", md: "32" },
						})}
						priority
					/>

					{/* キャッチコピー */}
					<h1
						className={css({
							fontSize: { base: "3xl", md: "5xl" },
							fontWeight: "bold",
							lineHeight: "tight",
							letterSpacing: "tight",
						})}
					>
						今日のあなたを、30秒で把握。
					</h1>

					{/* サブコピー */}
					<p
						className={css({
							fontSize: { base: "md", md: "xl" },
							color: "fg.muted",
							maxWidth: "2xl",
							lineHeight: "relaxed",
						})}
					>
						複数のGoogleカレンダーを統合し、AIが一人社長の一日をスマートにナビゲート。
					</p>

					{/* CTAボタン */}
					<form action={handleGoogleSignIn}>
						<button type="submit" className={ctaButtonStyle}>
							<Image
								src="/icons/google.svg"
								alt="Google"
								width={24}
								height={24}
								className={css({ width: "6", height: "6" })}
							/>
							Googleで無料で始める
						</button>
					</form>

					{/* 補足テキスト */}
					<p
						className={css({
							fontSize: "sm",
							color: "fg.muted",
						})}
					>
						無料で始める · クレジットカード不要
					</p>
				</div>
			</section>

			{/* ===== セクション2: 3つの特徴 ===== */}
			<section
				className={css({
					py: { base: "16", md: "24" },
					bg: "bg.default",
				})}
			>
				<div className={sectionStyle}>
					{/* セクション見出し */}
					<h2
						className={css({
							fontSize: { base: "2xl", md: "3xl" },
							fontWeight: "bold",
							textAlign: "center",
							mb: { base: "10", md: "16" },
						})}
					>
						miipaが選ばれる理由
					</h2>

					{/* 特徴カード3列 */}
					<div
						className={css({
							display: "flex",
							flexDirection: { base: "column", md: "row" },
							gap: { base: "6", md: "8" },
						})}
					>
						{/* 特徴1: カレンダー統合 */}
						<div
							className={css({
								flex: "1",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								textAlign: "center",
								gap: "4",
								p: { base: "6", md: "8" },
								bg: "bg.subtle",
								border: "1px solid",
								borderColor: "border.default",
								borderRadius: "xl",
								transition: "all 0.2s",
								_hover: {
									borderColor: "#C8893A",
									boxShadow: "0 0 0 1px rgba(200, 137, 58, 0.2)",
								},
							})}
						>
							<span
								className={css({
									fontSize: { base: "4xl", md: "5xl" },
									lineHeight: "1",
								})}
							>
								📅
							</span>
							<h3
								className={css({
									fontSize: { base: "lg", md: "xl" },
									fontWeight: "bold",
								})}
							>
								30秒で今日を把握
							</h3>
							<p
								className={css({
									color: "fg.muted",
									fontSize: "sm",
									lineHeight: "relaxed",
								})}
							>
								複数カレンダーの予定を一画面に統合。朝のルーティンが変わります。
							</p>
						</div>

						{/* 特徴2: AI分析 */}
						<div
							className={css({
								flex: "1",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								textAlign: "center",
								gap: "4",
								p: { base: "6", md: "8" },
								bg: "bg.subtle",
								border: "1px solid",
								borderColor: "border.default",
								borderRadius: "xl",
								transition: "all 0.2s",
								_hover: {
									borderColor: "#C8893A",
									boxShadow: "0 0 0 1px rgba(200, 137, 58, 0.2)",
								},
							})}
						>
							<span
								className={css({
									fontSize: { base: "4xl", md: "5xl" },
									lineHeight: "1",
								})}
							>
								✨
							</span>
							<h3
								className={css({
									fontSize: { base: "lg", md: "xl" },
									fontWeight: "bold",
								})}
							>
								AIがあなたの予定を分析
								<span
									className={css({
										fontSize: "xs",
										color: "fg.muted",
										fontWeight: "normal",
										ml: "2",
									})}
								>
									(近日実装予定)
								</span>
							</h3>
							<p
								className={css({
									color: "fg.muted",
									fontSize: "sm",
									lineHeight: "relaxed",
								})}
							>
								今日の予定の優先度や空き時間をAIが読み解き、的確な洞察を提供。
							</p>
						</div>

						{/* 特徴3: 安全性 */}
						<div
							className={css({
								flex: "1",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								textAlign: "center",
								gap: "4",
								p: { base: "6", md: "8" },
								bg: "bg.subtle",
								border: "1px solid",
								borderColor: "border.default",
								borderRadius: "xl",
								transition: "all 0.2s",
								_hover: {
									borderColor: "#C8893A",
									boxShadow: "0 0 0 1px rgba(200, 137, 58, 0.2)",
								},
							})}
						>
							<span
								className={css({
									fontSize: { base: "4xl", md: "5xl" },
									lineHeight: "1",
								})}
							>
								🛡️
							</span>
							<h3
								className={css({
									fontSize: { base: "lg", md: "xl" },
									fontWeight: "bold",
								})}
							>
								安心のread-only
							</h3>
							<p
								className={css({
									color: "fg.muted",
									fontSize: "sm",
									lineHeight: "relaxed",
								})}
							>
								カレンダーの読み取りのみ。予定の変更・削除は一切行いません。
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ===== セクション3: 使い方3ステップ ===== */}
			<section
				className={css({
					py: { base: "16", md: "24" },
				})}
			>
				<div className={sectionStyle}>
					{/* セクション見出し */}
					<h2
						className={css({
							fontSize: { base: "2xl", md: "3xl" },
							fontWeight: "bold",
							textAlign: "center",
							mb: { base: "10", md: "16" },
						})}
					>
						かんたん3ステップ
					</h2>

					{/* ステップ3列 */}
					<div
						className={css({
							display: "flex",
							flexDirection: { base: "column", md: "row" },
							gap: { base: "8", md: "12" },
							alignItems: { base: "center", md: "flex-start" },
						})}
					>
						{/* ステップ1 */}
						<div
							className={css({
								flex: "1",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								textAlign: "center",
								gap: "4",
								maxWidth: { base: "sm", md: "none" },
							})}
						>
							<span
								className={css({
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: "14",
									height: "14",
									borderRadius: "full",
									bg: "#C8893A",
									color: "white",
									fontSize: "xl",
									fontWeight: "bold",
								})}
							>
								1
							</span>
							<h3
								className={css({
									fontSize: { base: "lg", md: "xl" },
									fontWeight: "bold",
								})}
							>
								Googleアカウントでサインイン
							</h3>
							<p
								className={css({
									color: "fg.muted",
									fontSize: "sm",
									lineHeight: "relaxed",
								})}
							>
								お使いのGoogleアカウントでワンクリックログイン。面倒な登録は不要です。
							</p>
						</div>

						{/* ステップ2 */}
						<div
							className={css({
								flex: "1",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								textAlign: "center",
								gap: "4",
								maxWidth: { base: "sm", md: "none" },
							})}
						>
							<span
								className={css({
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: "14",
									height: "14",
									borderRadius: "full",
									bg: "#C8893A",
									color: "white",
									fontSize: "xl",
									fontWeight: "bold",
								})}
							>
								2
							</span>
							<h3
								className={css({
									fontSize: { base: "lg", md: "xl" },
									fontWeight: "bold",
								})}
							>
								カレンダーを選択・統合
							</h3>
							<p
								className={css({
									color: "fg.muted",
									fontSize: "sm",
									lineHeight: "relaxed",
								})}
							>
								表示したいカレンダーを選ぶだけ。複数のカレンダーを一つにまとめます。
							</p>
						</div>

						{/* ステップ3 */}
						<div
							className={css({
								flex: "1",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								textAlign: "center",
								gap: "4",
								maxWidth: { base: "sm", md: "none" },
							})}
						>
							<span
								className={css({
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: "14",
									height: "14",
									borderRadius: "full",
									bg: "#C8893A",
									color: "white",
									fontSize: "xl",
									fontWeight: "bold",
								})}
							>
								3
							</span>
							<h3
								className={css({
									fontSize: { base: "lg", md: "xl" },
									fontWeight: "bold",
								})}
							>
								AIに今日の予定を聞くだけ
								<span
									className={css({
										fontSize: "xs",
										color: "fg.muted",
										fontWeight: "normal",
										ml: "2",
									})}
								>
									(近日実装予定)
								</span>
							</h3>
							<p
								className={css({
									color: "fg.muted",
									fontSize: "sm",
									lineHeight: "relaxed",
								})}
							>
								「今日の予定は？」と聞くだけで、AIが予定を整理して教えてくれます。
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* ===== セクション4: CTA（再度） ===== */}
			<section
				className={css({
					py: { base: "16", md: "24" },
					bg: "bg.default",
				})}
			>
				<div
					className={css({
						...sectionBaseStyle,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						textAlign: "center",
						gap: "6",
					})}
				>
					<h2
						className={css({
							fontSize: { base: "2xl", md: "3xl" },
							fontWeight: "bold",
						})}
					>
						さあ、始めましょう
					</h2>
					<p
						className={css({
							color: "fg.muted",
							fontSize: { base: "md", md: "lg" },
							maxWidth: "xl",
							lineHeight: "relaxed",
						})}
					>
						毎朝のカレンダーチェックを、もっとスマートに。
					</p>

					{/* CTAボタン */}
					<form action={handleGoogleSignIn}>
						<button type="submit" className={ctaButtonStyle}>
							<Image
								src="/icons/google.svg"
								alt="Google"
								width={24}
								height={24}
								className={css({ width: "6", height: "6" })}
							/>
							今すぐ無料で始める
						</button>
					</form>

					{/* 補足テキスト */}
					<p
						className={css({
							fontSize: "sm",
							color: "fg.muted",
						})}
					>
						クレジットカード不要 · いつでも退会可能
					</p>
				</div>
			</section>

			{/* ===== セクション5: フッター ===== */}
			<footer
				className={css({
					py: "8",
					borderTop: "1px solid",
					borderColor: "border.default",
				})}
			>
				<div
					className={css({
						...sectionBaseStyle,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "4",
					})}
				>
					{/* コピーライト */}
					<p
						className={css({
							fontSize: "sm",
							color: "fg.muted",
						})}
					>
						miipa &copy; 2026
					</p>

					{/* フッターリンク */}
					<div
						className={css({
							display: "flex",
							gap: "6",
						})}
					>
						<Link
							href="/privacy"
							className={css({
								color: "fg.muted",
								fontSize: "sm",
								transition: "color 0.2s",
								_hover: { color: "fg.default" },
							})}
						>
							プライバシーポリシー
						</Link>
						<Link
							href="/terms"
							className={css({
								color: "fg.muted",
								fontSize: "sm",
								transition: "color 0.2s",
								_hover: { color: "fg.default" },
							})}
						>
							利用規約
						</Link>
						<Link
							href="/tokushoho"
							className={css({
								color: "fg.muted",
								fontSize: "sm",
								transition: "color 0.2s",
								_hover: { color: "fg.default" },
							})}
						>
							特商法表記
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
