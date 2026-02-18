/**
 * Dialogコンポーネント
 *
 * React Native の Modal を使用したダイアログコンポーネントです。
 * Web版の Ark UI Dialog から移行し、NativeWind でスタイリングしています。
 *
 * @module components/ui/dialog
 *
 * @example
 * ```tsx
 * <Dialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="確認"
 *   description="この操作を実行しますか？"
 * >
 *   <Text>ダイアログの内容</Text>
 * </Dialog>
 * ```
 */

import type React from "react";
import { Modal, Pressable, Text, View } from "react-native";

/**
 * DialogコンポーネントのProps
 */
interface DialogProps {
	/** ダイアログの表示状態 */
	open: boolean;
	/** 表示状態変更時のコールバック */
	onOpenChange: (open: boolean) => void;
	/** ダイアログタイトル */
	title: string;
	/** ダイアログの説明テキスト（オプション） */
	description?: string;
	/** ダイアログ内のコンテンツ */
	children: React.ReactNode;
}

/**
 * ダイアログコンポーネント
 *
 * モーダルダイアログを表示します。
 * バックドロップタップで閉じることができます。
 *
 * @param props - コンポーネントのProps
 * @returns ダイアログ要素
 */
export function Dialog({
	open,
	onOpenChange,
	title,
	description,
	children,
}: DialogProps) {
	return (
		<Modal
			visible={open}
			transparent
			animationType="fade"
			onRequestClose={() => onOpenChange(false)}
		>
			{/* バックドロップ */}
			<Pressable
				className="flex-1 items-center justify-center bg-black/50"
				onPress={() => onOpenChange(false)}
			>
				{/* コンテンツカード - 内側のPressableでタップの伝播を防ぐ */}
				<Pressable
					className="mx-4 w-full max-w-md rounded-xl bg-bg p-6 shadow-lg"
					onPress={(e) => e.stopPropagation()}
				>
					{/* 閉じるボタン */}
					<Pressable
						className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-md"
						onPress={() => onOpenChange(false)}
						accessibilityLabel="閉じる"
						accessibilityRole="button"
					>
						<Text className="text-fg-muted text-lg">✕</Text>
					</Pressable>

					{/* タイトル */}
					<Text className="text-lg font-bold text-fg">{title}</Text>

					{/* 説明テキスト */}
					{description && (
						<Text className="mt-1 text-sm text-fg-muted">{description}</Text>
					)}

					{/* コンテンツ */}
					<View className="mt-4">{children}</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}
