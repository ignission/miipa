"use client";

/**
 * カレンダー管理クライアントラッパーコンポーネント
 *
 * カレンダー設定画面のメインクライアントコンポーネントです。
 * カレンダー一覧の表示、追加、削除、同期機能を統合管理します。
 *
 * @module components/calendar/CalendarsClientWrapper
 *
 * @example
 * ```tsx
 * // Server Componentから使用
 * <CalendarsClientWrapper />
 * ```
 */

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
	AddGoogleCalendarButton,
	AddICalDialog,
	CalendarList,
	DeleteCalendarDialog,
} from "@/components/calendar";
import {
	useAddGoogleCalendar,
	useCalendars,
	useDeleteCalendar,
	useSyncCalendars,
} from "@/hooks";
import type { CalendarConfig, CalendarId } from "@/lib/config/types";
import { css } from "@/styled-system/css";

/**
 * 同期アイコン（SVG）
 */
function SyncIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({ width: "4", height: "4" })}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389 5.5 5.5 0 019.201-2.466l.312.311h-2.433a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * プラスアイコン（SVG）
 */
function PlusIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({ width: "4", height: "4" })}
			aria-hidden="true"
		>
			<path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
		</svg>
	);
}

/**
 * カレンダー管理クライアントラッパー
 *
 * カレンダー設定画面の状態管理とUIを統合します。
 * - カレンダー一覧の表示
 * - Google/iCalカレンダーの追加
 * - カレンダーの削除
 * - 全カレンダーの同期
 * - OAuth callbackからの成功/エラー通知
 *
 * @returns カレンダー管理画面要素
 */
export function CalendarsClientWrapper() {
	// URLパラメータから通知状態を取得
	const searchParams = useSearchParams();

	// カレンダー一覧管理
	const {
		calendars,
		isLoading,
		error: calendarsError,
		refetch,
	} = useCalendars();

	// Google OAuth認証
	const { error: googleAuthError } = useAddGoogleCalendar();

	// カレンダー削除
	const { deleteCalendar, error: deleteError } = useDeleteCalendar();

	// カレンダー同期
	const {
		sync,
		isSyncing,
		lastSyncTime,
		error: syncError,
	} = useSyncCalendars();

	// iCalダイアログの開閉状態
	const [isICalDialogOpen, setIsICalDialogOpen] = useState(false);

	// 削除ダイアログの開閉状態と対象カレンダー
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [calendarToDelete, setCalendarToDelete] =
		useState<CalendarConfig | null>(null);

	// 通知メッセージ
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	// 同期エラーが発生したカレンダーIDのマップ
	const [syncErrorMap, setSyncErrorMap] = useState<Map<CalendarId, boolean>>(
		new Map(),
	);

	/**
	 * URLパラメータから通知を処理する
	 *
	 * OAuth callbackから返された成功/エラーを表示します。
	 */
	useEffect(() => {
		const calendarParam = searchParams.get("calendar");
		const messageParam = searchParams.get("message");

		if (calendarParam === "success") {
			setNotification({
				type: "success",
				message: "Googleカレンダーを追加しました",
			});
			// カレンダー一覧を再取得
			refetch();
			// URLパラメータをクリア（履歴を置換）
			const url = new URL(window.location.href);
			url.searchParams.delete("calendar");
			url.searchParams.delete("message");
			window.history.replaceState({}, "", url.toString());
		} else if (calendarParam === "error") {
			setNotification({
				type: "error",
				message: messageParam || "Googleカレンダーの追加に失敗しました",
			});
			// URLパラメータをクリア
			const url = new URL(window.location.href);
			url.searchParams.delete("calendar");
			url.searchParams.delete("message");
			window.history.replaceState({}, "", url.toString());
		}
	}, [searchParams, refetch]);

	/**
	 * APIエラーを通知として表示
	 */
	useEffect(() => {
		const error = calendarsError || googleAuthError || deleteError || syncError;
		if (error) {
			setNotification({ type: "error", message: error });
		}
	}, [calendarsError, googleAuthError, deleteError, syncError]);

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
	 * カレンダーの有効/無効をトグルする
	 */
	const handleToggle = useCallback(
		async (id: CalendarId, enabled: boolean) => {
			try {
				const response = await fetch(`/api/calendars/${id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ enabled }),
				});

				if (!response.ok) {
					const data = await response.json();
					setNotification({
						type: "error",
						message: data.error?.message || "カレンダーの更新に失敗しました",
					});
					return;
				}

				await refetch();
			} catch (error) {
				setNotification({
					type: "error",
					message: "カレンダーの更新に失敗しました",
				});
			}
		},
		[refetch],
	);

	/**
	 * 削除ダイアログを開く
	 */
	const handleDeleteRequest = useCallback(
		(id: CalendarId) => {
			const calendar = calendars.find((cal) => cal.id === id);
			if (calendar) {
				setCalendarToDelete(calendar);
				setIsDeleteDialogOpen(true);
			}
		},
		[calendars],
	);

	/**
	 * カレンダーを削除する
	 */
	const handleDeleteConfirm = useCallback(async () => {
		if (!calendarToDelete) return;

		const success = await deleteCalendar(String(calendarToDelete.id));
		if (success) {
			setNotification({
				type: "success",
				message: `${calendarToDelete.name}を削除しました`,
			});
			setIsDeleteDialogOpen(false);
			setCalendarToDelete(null);
			await refetch();
		}
	}, [calendarToDelete, deleteCalendar, refetch]);

	/**
	 * 削除ダイアログを閉じる
	 */
	const handleDeleteCancel = useCallback(() => {
		setIsDeleteDialogOpen(false);
		setCalendarToDelete(null);
	}, []);

	/**
	 * 全カレンダーを同期する
	 */
	const handleSync = useCallback(async () => {
		const result = await sync();
		if (result) {
			// 同期エラーマップを更新
			const newErrorMap = new Map<CalendarId, boolean>();
			for (const errorCal of result.errorCalendars) {
				newErrorMap.set(errorCal.id as CalendarId, true);
			}
			setSyncErrorMap(newErrorMap);

			// 同期結果を通知
			if (result.errorCalendars.length > 0) {
				setNotification({
					type: "error",
					message: `${result.successCount}件同期、${result.errorCalendars.length}件エラー`,
				});
			} else {
				setNotification({
					type: "success",
					message: `${result.successCount}件のカレンダーを同期しました`,
				});
			}

			// カレンダー一覧を再取得
			await refetch();
		}
	}, [sync, refetch]);

	/**
	 * iCalダイアログを開く
	 */
	const handleOpenICalDialog = useCallback(() => {
		setIsICalDialogOpen(true);
	}, []);

	/**
	 * iCalダイアログを閉じる
	 */
	const handleCloseICalDialog = useCallback(() => {
		setIsICalDialogOpen(false);
	}, []);

	/**
	 * iCalカレンダー追加成功時
	 */
	const handleICalSuccess = useCallback(async () => {
		setIsICalDialogOpen(false);
		setNotification({
			type: "success",
			message: "iCalカレンダーを追加しました",
		});
		await refetch();
	}, [refetch]);

	/**
	 * 最終同期時刻の表示用フォーマット
	 */
	const formatLastSyncTime = (date: Date | null): string => {
		if (!date) return "未同期";
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);

		if (diffMinutes < 1) return "たった今";
		if (diffMinutes < 60) return `${diffMinutes}分前`;
		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}時間前`;
		return date.toLocaleDateString("ja-JP");
	};

	return (
		<div
			className={css({ display: "flex", flexDirection: "column", gap: "6" })}
		>
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

			{/* ヘッダー: 同期ボタンと最終同期時刻 */}
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				})}
			>
				<div
					className={css({ display: "flex", alignItems: "center", gap: "3" })}
				>
					<button
						type="button"
						onClick={handleSync}
						disabled={isSyncing || calendars.length === 0}
						className={css({
							display: "flex",
							alignItems: "center",
							gap: "2",
							px: "4",
							py: "2",
							bg: "accent.default",
							color: "accent.fg",
							borderRadius: "md",
							fontWeight: "medium",
							cursor: "pointer",
							border: "none",
							transition: "all 0.15s ease",
							_hover: {
								bg: "accent.emphasized",
							},
							_disabled: {
								opacity: 0.6,
								cursor: "not-allowed",
							},
						})}
						aria-busy={isSyncing}
					>
						<span
							className={css({
								animation: isSyncing ? "spin 1s linear infinite" : "none",
							})}
						>
							<SyncIcon />
						</span>
						<span>{isSyncing ? "同期中..." : "同期"}</span>
					</button>
					<span className={css({ fontSize: "sm", color: "fg.muted" })}>
						最終同期: {formatLastSyncTime(lastSyncTime)}
					</span>
				</div>
			</div>

			{/* カレンダー追加ボタン */}
			<div
				className={css({
					display: "flex",
					flexDirection: { base: "column", sm: "row" },
					gap: "3",
				})}
			>
				<AddGoogleCalendarButton />
				<button
					type="button"
					onClick={handleOpenICalDialog}
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
					})}
				>
					<PlusIcon />
					<span>iCalを追加</span>
				</button>
			</div>

			{/* ローディング状態 */}
			{isLoading && (
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						py: "8",
						color: "fg.muted",
					})}
				>
					カレンダーを読み込み中...
				</div>
			)}

			{/* カレンダー一覧 */}
			{!isLoading && (
				<CalendarList
					calendars={calendars}
					onToggle={handleToggle}
					onDelete={handleDeleteRequest}
					onSync={handleSync}
					isSyncing={isSyncing}
					lastSyncTime={lastSyncTime ?? undefined}
					errorMap={syncErrorMap}
				/>
			)}

			{/* iCalカレンダー追加ダイアログ */}
			<AddICalDialog
				isOpen={isICalDialogOpen}
				onClose={handleCloseICalDialog}
				onSuccess={handleICalSuccess}
			/>

			{/* カレンダー削除確認ダイアログ */}
			<DeleteCalendarDialog
				isOpen={isDeleteDialogOpen}
				calendar={calendarToDelete}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
