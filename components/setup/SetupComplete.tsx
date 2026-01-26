"use client";

/**
 * SetupCompleteコンポーネント
 *
 * セットアップウィザードの完了画面を表示するコンポーネントです。
 * 選択したプロバイダの情報を表示し、自動またはボタンクリックで
 * メイン画面へ遷移します。
 *
 * @module components/setup/SetupComplete
 *
 * @example
 * ```tsx
 * <SetupComplete
 *   provider="claude"
 *   onStart={() => router.push('/')}
 *   autoRedirectSeconds={5}
 * />
 * ```
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { LLMProvider } from "@/lib/config/types";
import { css } from "@/styled-system/css";
import { PROVIDER_INFO } from "./types";

/**
 * SetupCompleteコンポーネントのProps
 */
interface SetupCompleteProps {
	/** 選択されたプロバイダ */
	provider: LLMProvider;
	/** 開始ボタン押下時のコールバック */
	onStart: () => void;
	/** 自動リダイレクト秒数（デフォルト5秒） */
	autoRedirectSeconds?: number;
}

/**
 * セットアップ完了画面
 *
 * セットアップウィザードの最終ステップを表示します。
 * カウントダウンタイマーにより自動でメイン画面へ遷移するか、
 * ボタンクリックで即座に遷移できます。
 *
 * @param props - コンポーネントのProps
 * @param props.provider - 選択されたLLMプロバイダ
 * @param props.onStart - 開始ボタン押下時のコールバック
 * @param props.autoRedirectSeconds - 自動リダイレクト秒数（デフォルト5秒）
 * @returns セットアップ完了画面要素
 */
export function SetupComplete({
	provider,
	onStart,
	autoRedirectSeconds = 5,
}: SetupCompleteProps) {
	const [countdown, setCountdown] = useState(autoRedirectSeconds);
	const info = PROVIDER_INFO[provider];

	useEffect(() => {
		// カウントダウンが0になったら自動でonStartを呼び出し
		if (countdown <= 0) {
			onStart();
			return;
		}

		// 1秒ごとにカウントダウンを減らす
		const timer = setTimeout(() => {
			setCountdown(countdown - 1);
		}, 1000);

		return () => clearTimeout(timer);
	}, [countdown, onStart]);

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				gap: "6",
				py: "8",
			})}
		>
			{/* ミーアキャットイラスト */}
			<Image
				src="/icons/meerkat-celebration.svg"
				alt="セットアップ完了"
				width={128}
				height={128}
				className={css({ width: "32", height: "32" })}
				priority
			/>

			{/* 完了メッセージ */}
			<div
				className={css({ display: "flex", flexDirection: "column", gap: "2" })}
			>
				<h2 className={css({ fontSize: "2xl", fontWeight: "bold" })}>
					セットアップが完了しました!
				</h2>
				<p className={css({ color: "fg.muted" })}>
					{info.name} を使用する準備ができました
				</p>
			</div>

			{/* 設定確認 */}
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "3",
					p: "4",
					bg: "bg.muted",
					borderRadius: "lg",
				})}
			>
				<Image
					src={info.iconPath}
					alt={info.name}
					width={24}
					height={24}
					className={css({ width: "6", height: "6" })}
				/>
				<span className={css({ fontWeight: "medium" })}>{info.name}</span>
			</div>

			{/* ボタングループ */}
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "3",
				})}
			>
				{/* 開始ボタン */}
				<button
					type="button"
					onClick={onStart}
					className={css({
						px: "8",
						py: "3",
						bg: "accent.default",
						color: "accent.fg",
						borderRadius: "lg",
						fontWeight: "semibold",
						fontSize: "lg",
						cursor: "pointer",
						transition: "all 0.2s",
						_hover: { bg: "accent.emphasized", transform: "scale(1.02)" },
					})}
				>
					SoloDayを始める
				</button>

				{/* カレンダー設定ボタン */}
				<Link
					href="/settings/calendars"
					className={css({
						px: "6",
						py: "2",
						bg: "transparent",
						color: "fg.muted",
						border: "1px solid",
						borderColor: "border.default",
						borderRadius: "lg",
						fontWeight: "medium",
						fontSize: "sm",
						cursor: "pointer",
						transition: "all 0.2s",
						textDecoration: "none",
						_hover: {
							bg: "bg.muted",
							color: "fg.default",
							borderColor: "border.emphasized",
						},
					})}
				>
					カレンダーを設定
				</Link>
			</div>

			{/* カウントダウン */}
			<p className={css({ color: "fg.muted", fontSize: "sm" })}>
				{countdown}秒後に自動的に移動します...
			</p>
		</div>
	);
}
