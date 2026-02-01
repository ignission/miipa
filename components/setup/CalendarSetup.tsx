"use client";

/**
 * カレンダーセットアップコンポーネント
 *
 * セットアップフロー内でカレンダーを連携するためのUIコンポーネントです。
 * Googleカレンダーの追加と、連携済みカレンダーの表示を行います。
 *
 * @module components/setup/CalendarSetup
 *
 * @example
 * ```tsx
 * <CalendarSetup
 *   onComplete={() => setStep('ai')}
 * />
 * ```
 */

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAddGoogleCalendar, useCalendars } from "@/hooks";
import { css } from "@/styled-system/css";

/**
 * CalendarSetupコンポーネントのProps
 */
interface CalendarSetupProps {
	/** カレンダー設定完了時のコールバック */
	onComplete: () => void;
}

/**
 * チェックアイコン（SVG）
 */
function CheckIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({ width: "5", height: "5" })}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * カレンダーセットアップ
 *
 * セットアップウィザード内でカレンダーを連携するUIを提供します。
 * - Googleカレンダー連携ボタン
 * - 連携済みカレンダーの表示
 * - 次のステップへ進むボタン
 *
 * @param props - コンポーネントのProps
 * @returns カレンダーセットアップ要素
 */
export function CalendarSetup({ onComplete }: CalendarSetupProps) {
	// URLパラメータから通知状態を取得
	const searchParams = useSearchParams();

	// カレンダー一覧管理
	const { calendars, isLoading, refetch } = useCalendars();

	// Google OAuth認証
	const {
		startAuth,
		isLoading: isAuthLoading,
		error: authError,
	} = useAddGoogleCalendar();

	// 通知メッセージ
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	/**
	 * URLパラメータから通知を処理する
	 */
	useEffect(() => {
		const calendarParam = searchParams.get("calendar");
		const messageParam = searchParams.get("message");

		if (calendarParam === "success") {
			setNotification({
				type: "success",
				message: "Googleカレンダーを追加しました",
			});
			refetch();
			// URLパラメータをクリア
			const url = new URL(window.location.href);
			url.searchParams.delete("calendar");
			url.searchParams.delete("message");
			window.history.replaceState({}, "", url.toString());
		} else if (calendarParam === "error") {
			setNotification({
				type: "error",
				message: messageParam || "Googleカレンダーの追加に失敗しました",
			});
			const url = new URL(window.location.href);
			url.searchParams.delete("calendar");
			url.searchParams.delete("message");
			window.history.replaceState({}, "", url.toString());
		}
	}, [searchParams, refetch]);

	/**
	 * 通知を自動的に消す
	 */
	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => {
				setNotification(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

	/**
	 * Googleカレンダー連携を開始
	 */
	const handleAddGoogle = useCallback(async () => {
		await startAuth();
	}, [startAuth]);

	// 連携済みカレンダーがあるかどうか
	const hasCalendars = calendars.length > 0;

	return (
		<div
			className={css({ display: "flex", flexDirection: "column", gap: "6" })}
		>
			{/* 説明文 */}
			<div className={css({ textAlign: "center" })}>
				<p className={css({ color: "fg.muted", fontSize: "sm" })}>
					Googleカレンダーを連携して、予定を確認できるようにしましょう
				</p>
			</div>

			{/* 通知メッセージ */}
			{notification && (
				<div
					className={css({
						p: "3",
						borderRadius: "md",
						fontSize: "sm",
						bg: notification.type === "success" ? "green.100" : "red.100",
						color: notification.type === "success" ? "green.800" : "red.800",
					})}
					role="alert"
				>
					{notification.message}
				</div>
			)}

			{/* Googleカレンダー連携ボタン */}
			<button
				type="button"
				onClick={handleAddGoogle}
				disabled={isAuthLoading}
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "3",
					width: "full",
					p: "4",
					bg: "bg.default",
					color: "fg.default",
					border: "1px solid",
					borderColor: "border.default",
					borderRadius: "lg",
					fontWeight: "medium",
					cursor: "pointer",
					transition: "all 0.15s ease",
					_hover: {
						bg: "bg.subtle",
						borderColor: "border.muted",
					},
					_disabled: {
						opacity: 0.6,
						cursor: "not-allowed",
					},
				})}
				aria-busy={isAuthLoading}
			>
				<Image
					src="/icons/google.svg"
					alt=""
					width={24}
					height={24}
					className={css({ width: "6", height: "6" })}
					aria-hidden="true"
				/>
				<span className={css({ fontSize: "md" })}>
					{isAuthLoading ? "認証中..." : "Googleカレンダーを連携"}
				</span>
			</button>

			{/* 認証エラーメッセージ */}
			{authError && (
				<div
					className={css({
						p: "3",
						borderRadius: "md",
						fontSize: "sm",
						bg: "red.100",
						color: "red.800",
					})}
					role="alert"
				>
					{authError}
				</div>
			)}

			{/* ローディング状態 */}
			{isLoading && (
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						py: "4",
						color: "fg.muted",
						fontSize: "sm",
					})}
				>
					読み込み中...
				</div>
			)}

			{/* 連携済みカレンダー一覧 */}
			{!isLoading && hasCalendars && (
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
				>
					<h3
						className={css({
							fontSize: "sm",
							fontWeight: "medium",
							color: "fg.muted",
						})}
					>
						連携済みカレンダー
					</h3>
					<ul
						className={css({
							display: "flex",
							flexDirection: "column",
							gap: "2",
							listStyle: "none",
							margin: 0,
							padding: 0,
						})}
					>
						{calendars.map((calendar) => (
							<li
								key={String(calendar.id)}
								className={css({
									display: "flex",
									alignItems: "center",
									gap: "3",
									p: "3",
									bg: "bg.subtle",
									borderRadius: "md",
									border: "1px solid",
									borderColor: "border.default",
								})}
							>
								<span
									className={css({
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										width: "8",
										height: "8",
										borderRadius: "full",
										bg: "green.100",
										color: "green.600",
									})}
								>
									<CheckIcon />
								</span>
								<div className={css({ flex: "1", minWidth: 0 })}>
									<p
										className={css({
											fontSize: "sm",
											fontWeight: "medium",
											color: "fg.default",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										})}
									>
										{calendar.name}
									</p>
									<p
										className={css({
											fontSize: "xs",
											color: "fg.muted",
										})}
									>
										{calendar.type === "google"
											? "Googleカレンダー"
											: "iCal"}
									</p>
								</div>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* 次へボタン */}
			<div
				className={css({ display: "flex", justifyContent: "center", pt: "4" })}
			>
				<button
					type="button"
					onClick={onComplete}
					disabled={!hasCalendars}
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "2",
						px: "8",
						py: "3",
						bg: hasCalendars ? "accent.default" : "neutral.4",
						color: hasCalendars ? "accent.fg" : "fg.muted",
						borderRadius: "lg",
						fontWeight: "medium",
						cursor: hasCalendars ? "pointer" : "not-allowed",
						border: "none",
						transition: "all 0.15s ease",
						_hover: hasCalendars
							? {
									bg: "accent.emphasized",
								}
							: {},
					})}
				>
					{hasCalendars ? "次へ進む" : "カレンダーを連携してください"}
				</button>
			</div>

			{/* スキップリンク */}
			{!hasCalendars && (
				<div className={css({ textAlign: "center" })}>
					<button
						type="button"
						onClick={onComplete}
						className={css({
							fontSize: "sm",
							color: "fg.muted",
							textDecoration: "underline",
							bg: "transparent",
							border: "none",
							cursor: "pointer",
							_hover: {
								color: "fg.default",
							},
						})}
					>
						後で設定する
					</button>
				</div>
			)}
		</div>
	);
}
