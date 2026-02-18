/**
 * カレンダー削除確認ダイアログコンポーネント
 *
 * カレンダーを削除する前に確認を求めるモーダルダイアログを提供します。
 *
 * @module components/settings/delete-calendar-dialog
 */

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Dialog } from "../ui/dialog";

// ============================================================
// 型定義
// ============================================================

/** カレンダー設定の型（必要最小限） */
interface CalendarConfig {
	id: string;
	name: string;
	type: "google" | "ical";
}

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

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * カレンダー削除確認ダイアログ
 *
 * カレンダーを削除する前に確認を求めます。
 * - カレンダー名を確認メッセージに表示
 * - キャンセル/削除ボタン
 * - 削除中はローディング状態を表示
 */
export function DeleteCalendarDialog({
	isOpen,
	calendar,
	onClose,
	onConfirm,
}: DeleteCalendarDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	/**
	 * 削除確認ハンドラ
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
	 * ダイアログを閉じるハンドラ（削除中は閉じない）
	 */
	const handleClose = () => {
		if (!isDeleting) {
			onClose();
		}
	};

	if (!calendar) return null;

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			title="カレンダーを削除"
			description={`「${calendar.name}」を削除しますか？`}
		>
			<View className="gap-4">
				<Text className="text-sm text-fg-muted">
					この操作は取り消せません。カレンダーの設定と同期データが削除されます。
				</Text>

				{/* ボタン */}
				<View className="flex-row justify-end gap-3">
					<Pressable
						onPress={handleClose}
						disabled={isDeleting}
						className={`rounded-md border border-border px-4 py-2 ${
							isDeleting ? "opacity-60" : "active:bg-bg-subtle"
						}`}
					>
						<Text className="font-medium text-fg">キャンセル</Text>
					</Pressable>
					<Pressable
						onPress={handleConfirm}
						disabled={isDeleting}
						accessibilityState={{ busy: isDeleting }}
						className={`rounded-md bg-red-600 px-4 py-2 ${
							isDeleting ? "opacity-60" : ""
						}`}
					>
						<Text className="font-medium text-white">
							{isDeleting ? "削除中..." : "削除"}
						</Text>
					</Pressable>
				</View>
			</View>
		</Dialog>
	);
}
