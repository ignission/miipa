"use client";

/**
 * アカウント削除確認ダイアログコンポーネント
 *
 * アカウントを削除する前に確認を求めるモーダルダイアログを提供します。
 * 削除処理はAPIを呼び出し、成功時にサインアウトしてリダイレクトします。
 *
 * @module components/account/DeleteAccountDialog
 */

import { signOut } from "next-auth/react";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { css } from "@/styled-system/css";

/** DeleteAccountDialogコンポーネントのProps */
interface DeleteAccountDialogProps {
	/** ダイアログの開閉状態 */
	isOpen: boolean;
	/** ダイアログを閉じる際のコールバック */
	onClose: () => void;
}

/**
 * アカウント削除確認ダイアログ
 *
 * アカウントを削除する前に確認を求めます。
 * - すべてのデータが削除される旨を警告
 * - キャンセル/削除ボタン
 * - 削除中はローディング状態を表示
 * - 成功時にサインアウト＆リダイレクト
 */
export function DeleteAccountDialog({
	isOpen,
	onClose,
}: DeleteAccountDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** 削除確認ハンドラ */
	const handleConfirm = async () => {
		setIsDeleting(true);
		setError(null);
		try {
			const res = await fetch("/api/account", { method: "DELETE" });
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as {
					error?: string;
				} | null;
				throw new Error(data?.error ?? "アカウントの削除に失敗しました");
			}
			await signOut({ callbackUrl: "/auth/signin" });
		} catch (e) {
			setError(
				e instanceof Error ? e.message : "アカウントの削除に失敗しました",
			);
			setIsDeleting(false);
		}
	};

	/** ダイアログを閉じるハンドラ（削除中は閉じない） */
	const handleClose = () => {
		if (!isDeleting) {
			setError(null);
			onClose();
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content
					className={css({
						maxWidth: "sm",
					})}
				>
					<Dialog.CloseTrigger />
					<Dialog.Title>アカウントを削除しますか？</Dialog.Title>
					<Dialog.Description>
						すべてのカレンダー設定、同期データ、認証情報が完全に削除されます。この操作は取り消せません。
					</Dialog.Description>

					{/* エラーメッセージ */}
					{error && (
						<p
							className={css({
								fontSize: "sm",
								color: "red.9",
								mb: "4",
								p: "3",
								bg: "red.2",
								borderRadius: "md",
							})}
						>
							{error}
						</p>
					)}

					{/* ボタン */}
					<div
						className={css({
							display: "flex",
							justifyContent: "flex-end",
							gap: "3",
						})}
					>
						<button
							type="button"
							onClick={handleClose}
							disabled={isDeleting}
							className={css({
								px: "4",
								py: "2",
								bg: "transparent",
								color: "fg.default",
								border: "1px solid",
								borderColor: "border.default",
								borderRadius: "md",
								fontWeight: "medium",
								cursor: "pointer",
								transition: "all 0.15s ease",
								_hover: {
									bg: "bg.subtle",
								},
								_disabled: {
									opacity: 0.6,
									cursor: "not-allowed",
								},
							})}
						>
							キャンセル
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							disabled={isDeleting}
							className={css({
								px: "4",
								py: "2",
								bg: "red.9",
								color: "red.fg",
								borderRadius: "md",
								fontWeight: "medium",
								cursor: "pointer",
								border: "none",
								transition: "all 0.15s ease",
								_hover: {
									bg: "red.10",
								},
								_disabled: {
									opacity: 0.6,
									cursor: "not-allowed",
								},
							})}
							aria-busy={isDeleting}
						>
							{isDeleting ? "削除中..." : "削除する"}
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
