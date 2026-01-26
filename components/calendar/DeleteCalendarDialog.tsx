"use client";

/**
 * カレンダー削除確認ダイアログコンポーネント
 *
 * カレンダーを削除する前に確認を求めるモーダルダイアログを提供します。
 * カレンダー名を表示し、削除の意思を確認します。
 *
 * @module components/calendar/DeleteCalendarDialog
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const [selectedCalendar, setSelectedCalendar] = useState<CalendarConfig | null>(null);
 *
 * <DeleteCalendarDialog
 *   isOpen={isOpen}
 *   calendar={selectedCalendar}
 *   onClose={() => {
 *     setIsOpen(false);
 *     setSelectedCalendar(null);
 *   }}
 *   onConfirm={async () => {
 *     await deleteCalendar(selectedCalendar!.id);
 *     setIsOpen(false);
 *   }}
 * />
 * ```
 */

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import type { CalendarConfig } from "@/lib/config/types";
import { css } from "@/styled-system/css";

/**
 * DeleteCalendarDialogコンポーネントのProps
 */
interface DeleteCalendarDialogProps {
	/** ダイアログの開閉状態 */
	isOpen: boolean;
	/** 削除対象のカレンダー（nullの場合はダイアログ非表示） */
	calendar: CalendarConfig | null;
	/** ダイアログを閉じる際のコールバック */
	onClose: () => void;
	/** 削除確認時のコールバック（非同期） */
	onConfirm: () => Promise<void>;
}

/**
 * カレンダー削除確認ダイアログ
 *
 * カレンダーを削除する前に確認を求めます。
 * - カレンダー名を確認メッセージに表示
 * - キャンセル/削除ボタン
 * - 削除中はローディング状態を表示
 *
 * @param props - コンポーネントのProps
 * @returns カレンダー削除確認ダイアログ
 */
export function DeleteCalendarDialog({
	isOpen,
	calendar,
	onClose,
	onConfirm,
}: DeleteCalendarDialogProps) {
	// 削除処理中フラグ
	const [isDeleting, setIsDeleting] = useState(false);

	/**
	 * 削除確認ハンドラ
	 *
	 * 削除処理を実行し、完了後にダイアログを閉じます。
	 */
	const handleConfirm = async () => {
		setIsDeleting(true);
		try {
			await onConfirm();
		} finally {
			setIsDeleting(false);
		}
	};

	/**
	 * ダイアログを閉じる際のハンドラ
	 *
	 * 削除処理中は閉じられないようにします。
	 */
	const handleClose = () => {
		if (!isDeleting) {
			onClose();
		}
	};

	// カレンダーが指定されていない場合は何も表示しない
	if (!calendar) {
		return null;
	}

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
					<Dialog.Title>カレンダーを削除</Dialog.Title>
					<Dialog.Description>
						<strong
							className={css({
								color: "neutral.900",
								fontWeight: "semibold",
							})}
						>
							{calendar.name}
						</strong>
						を削除しますか？
					</Dialog.Description>

					<p
						className={css({
							fontSize: "sm",
							color: "neutral.500",
							mb: "4",
						})}
					>
						この操作は取り消せません。カレンダーの設定と同期データが削除されます。
					</p>

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
								border: "1px solid",
								borderColor: "border.default",
								borderRadius: "md",
								fontWeight: "medium",
								cursor: "pointer",
								transition: "all 0.15s ease",
								_hover: {
									bg: "neutral.50",
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
								bg: "red.500",
								color: "white",
								borderRadius: "md",
								fontWeight: "medium",
								cursor: "pointer",
								border: "none",
								transition: "all 0.15s ease",
								_hover: {
									bg: "red.600",
								},
								_disabled: {
									opacity: 0.6,
									cursor: "not-allowed",
								},
							})}
							aria-busy={isDeleting}
						>
							{isDeleting ? "削除中..." : "削除"}
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
