"use client";

/**
 * Googleカレンダー追加ボタンコンポーネント
 *
 * Google OAuth認証フローを開始するボタンを提供します。
 * クリックするとGoogleの認証画面にリダイレクトされます。
 *
 * @module components/calendar/AddGoogleCalendarButton
 *
 * @example
 * ```tsx
 * <AddGoogleCalendarButton
 *   onSuccess={() => console.log('認証開始')}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */

import Image from "next/image";
import { useEffect } from "react";
import { useAddGoogleCalendar } from "@/hooks";
import { css } from "@/styled-system/css";

/**
 * AddGoogleCalendarButtonコンポーネントのProps
 */
interface AddGoogleCalendarButtonProps {
	/** 認証開始成功時のコールバック */
	onSuccess?: () => void;
	/** エラー発生時のコールバック */
	onError?: (error: string) => void;
}

/**
 * Googleカレンダー追加ボタン
 *
 * useAddGoogleCalendarフックを使用してOAuth認証を開始します。
 * - クリックでGoogle認証画面にリダイレクト
 * - ローディング中はボタンを無効化
 * - エラー発生時はコールバックで通知
 *
 * @param props - コンポーネントのProps
 * @returns Googleカレンダー追加ボタン
 */
export function AddGoogleCalendarButton({
	onSuccess,
	onError,
}: AddGoogleCalendarButtonProps) {
	const { startAuth, isLoading, error } = useAddGoogleCalendar();

	// エラー発生時にコールバックを呼び出す
	useEffect(() => {
		if (error && onError) {
			onError(error);
		}
	}, [error, onError]);

	/**
	 * ボタンクリック時のハンドラ
	 *
	 * OAuth認証を開始し、成功時にコールバックを呼び出します。
	 */
	const handleClick = async () => {
		onSuccess?.();
		await startAuth();
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={isLoading}
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				gap: "2",
				width: "full",
				p: "3",
				bg: "bg.default",
				color: "fg.default",
				border: "1px solid",
				borderColor: "border.default",
				borderRadius: "md",
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
			aria-busy={isLoading}
		>
			<Image
				src="/icons/google.svg"
				alt=""
				width={20}
				height={20}
				className={css({ width: "5", height: "5" })}
				aria-hidden="true"
			/>
			<span>{isLoading ? "認証中..." : "Googleカレンダーを追加"}</span>
		</button>
	);
}
