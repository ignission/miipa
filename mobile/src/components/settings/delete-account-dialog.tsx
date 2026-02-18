/**
 * アカウント削除確認ダイアログコンポーネント
 *
 * アカウントを削除する前に確認を求めるモーダルダイアログを提供します。
 * 削除処理はAPIを呼び出し、成功時にログアウト処理を行います。
 *
 * @module components/settings/delete-account-dialog
 */

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ApiError, apiFetch } from "../../api/client";
import { Dialog } from "../ui/dialog";

// ============================================================
// 型定義
// ============================================================

/**
 * DeleteAccountDialogコンポーネントのProps
 */
interface DeleteAccountDialogProps {
	/** ダイアログの開閉状態 */
	isOpen: boolean;
	/** ダイアログを閉じる際のコールバック */
	onClose: () => void;
	/** ログアウト処理コールバック */
	onLogout: () => void;
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * アカウント削除確認ダイアログ
 *
 * アカウントを削除する前に確認を求めます。
 * - すべてのデータが削除される旨を警告
 * - キャンセル/削除ボタン
 * - 削除中はローディング状態を表示
 * - 成功時にログアウト処理を呼び出し
 */
export function DeleteAccountDialog({
	isOpen,
	onClose,
	onLogout,
}: DeleteAccountDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** 削除確認ハンドラ */
	const handleConfirm = async () => {
		setIsDeleting(true);
		setError(null);
		try {
			await apiFetch("/api/account", { method: "DELETE" });
			onLogout();
		} catch (e) {
			setError(
				e instanceof ApiError || e instanceof Error
					? e.message
					: "アカウントの削除に失敗しました",
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
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			title="アカウントを削除しますか？"
			description="すべてのカレンダー設定、同期データ、認証情報が完全に削除されます。この操作は取り消せません。"
		>
			<View className="gap-4">
				{/* エラーメッセージ */}
				{error && (
					<View className="rounded-md bg-red-50 p-3">
						<Text className="text-sm text-red-600">{error}</Text>
					</View>
				)}

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
							{isDeleting ? "削除中..." : "削除する"}
						</Text>
					</Pressable>
				</View>
			</View>
		</Dialog>
	);
}
