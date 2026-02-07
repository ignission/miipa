/**
 * サインインページ（Server Component）
 *
 * Google OAuthサインインUIを提供するServer Componentです。
 * ミーアキャットキャラクターとウェルカムメッセージを表示し、
 * Server Action経由でGoogleサインインを実行します。
 *
 * @module app/auth/signin/page
 */

import Image from "next/image";
import { signIn } from "@/auth";
import { css } from "@/styled-system/css";

/**
 * Googleサインイン Server Action
 */
async function handleGoogleSignIn() {
	"use server";
	await signIn("google", { redirectTo: "/" });
}

/**
 * サインインページ
 *
 * 未認証ユーザーにGoogle OAuthログインUIを提供します。
 * ミーアキャットキャラクター、ウェルカムメッセージ、
 * Googleサインインボタンを中央寄せカードレイアウトで表示します。
 *
 * @returns サインインページ要素
 */
export default function SignInPage() {
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
					alignItems: "center",
					textAlign: "center",
					gap: "6",
					p: "8",
					bg: "bg.default",
					borderRadius: "xl",
					border: "1px solid",
					borderColor: "border.default",
					boxShadow: "lg",
					maxWidth: "sm",
					width: "full",
				})}
			>
				{/* ミーアキャットキャラクター */}
				<Image
					src="/icons/meerkat-celebration.svg"
					alt="miipa ミーアキャット"
					width={128}
					height={128}
					className={css({ width: "32", height: "32" })}
					priority
				/>

				{/* ウェルカムメッセージ */}
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "2",
					})}
				>
					<h1 className={css({ fontSize: "2xl", fontWeight: "bold" })}>
						miipaへようこそ
					</h1>
					<p className={css({ color: "fg.muted", fontSize: "sm" })}>
						一人社長向けカレンダー統合AIアシスタント
					</p>
				</div>

				{/* Googleサインインボタン */}
				<form action={handleGoogleSignIn}>
					<button
						type="submit"
						className={css({
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "3",
							px: "6",
							py: "3",
							bg: "bg.default",
							color: "fg.default",
							border: "1px solid",
							borderColor: "border.default",
							borderRadius: "lg",
							fontWeight: "medium",
							fontSize: "md",
							cursor: "pointer",
							transition: "all 0.2s",
							width: "full",
							_hover: {
								bg: "bg.muted",
								borderColor: "border.emphasized",
							},
						})}
					>
						<Image
							src="/icons/google.svg"
							alt="Google"
							width={20}
							height={20}
							className={css({ width: "5", height: "5" })}
						/>
						Googleでサインイン
					</button>
				</form>
			</div>
		</div>
	);
}
