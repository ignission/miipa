/**
 * iCalカレンダー追加ダイアログコンポーネント
 *
 * iCal URLを入力してカレンダーを追加するためのモーダルダイアログを提供します。
 *
 * @module components/settings/add-ical-dialog
 */

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Dialog } from "../ui/dialog";

// ============================================================
// 型定義
// ============================================================

/**
 * AddICalDialogコンポーネントのProps
 */
interface AddICalDialogProps {
	/** ダイアログの開閉状態 */
	isOpen: boolean;
	/** ダイアログを閉じる際のコールバック */
	onClose: () => void;
	/** カレンダー追加コールバック */
	onAdd: (url: string, name?: string) => Promise<boolean>;
	/** 追加中フラグ */
	isLoading: boolean;
	/** APIエラー */
	error: string | null;
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * iCalカレンダー追加ダイアログ
 *
 * iCal形式のカレンダーURLを入力してカレンダーを追加します。
 * - URL入力（必須、バリデーション付き）
 * - カレンダー名入力（任意）
 * - キャンセル/追加ボタン
 */
export function AddICalDialog({
	isOpen,
	onClose,
	onAdd,
	isLoading,
	error,
}: AddICalDialogProps) {
	const [url, setUrl] = useState("");
	const [name, setName] = useState("");
	const [urlError, setUrlError] = useState<string | null>(null);

	/**
	 * URLのバリデーション
	 */
	const validateUrl = (value: string): boolean => {
		if (!value.trim()) {
			setUrlError("URLを入力してください");
			return false;
		}

		try {
			const parsed = new URL(value);
			if (!["http:", "https:"].includes(parsed.protocol)) {
				setUrlError(
					"http:// または https:// で始まるURLを入力してください",
				);
				return false;
			}
		} catch {
			setUrlError("有効なURLを入力してください");
			return false;
		}

		setUrlError(null);
		return true;
	};

	/**
	 * 送信ハンドラ
	 */
	const handleSubmit = async () => {
		if (!validateUrl(url)) return;

		const result = await onAdd(url, name.trim() || undefined);
		if (result) {
			setUrl("");
			setName("");
			setUrlError(null);
			onClose();
		}
	};

	/**
	 * ダイアログを閉じるハンドラ
	 */
	const handleClose = () => {
		setUrl("");
		setName("");
		setUrlError(null);
		onClose();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			title="iCalカレンダーを追加"
			description="iCal形式のカレンダーURLを入力してください"
		>
			<View className="gap-4">
				{/* URL入力 */}
				<View className="gap-2">
					<View className="flex-row">
						<Text className="text-sm font-medium text-fg">URL</Text>
						<Text className="ml-1 text-red-500">*</Text>
					</View>
					<TextInput
						value={url}
						onChangeText={(text) => {
							setUrl(text);
							if (urlError) setUrlError(null);
						}}
						onBlur={() => url && validateUrl(url)}
						placeholder="https://..."
						placeholderTextColor="#78716c"
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="url"
						className={`w-full rounded-md border p-3 text-fg ${
							urlError ? "border-red-500" : "border-border"
						}`}
					/>
					{urlError && (
						<Text
							className="text-sm text-red-500"
							accessibilityRole="alert"
						>
							{urlError}
						</Text>
					)}
				</View>

				{/* 名前入力 */}
				<View className="gap-2">
					<View className="flex-row">
						<Text className="text-sm font-medium text-fg">
							カレンダー名
						</Text>
						<Text className="ml-1 text-fg-subtle">（任意）</Text>
					</View>
					<TextInput
						value={name}
						onChangeText={setName}
						placeholder="カレンダー名"
						placeholderTextColor="#78716c"
						className="w-full rounded-md border border-border p-3 text-fg"
					/>
				</View>

				{/* APIエラー表示 */}
				{error && (
					<View
						className="rounded-md bg-red-100 p-3"
						accessibilityRole="alert"
					>
						<Text className="text-sm text-red-800">{error}</Text>
					</View>
				)}

				{/* ボタン */}
				<View className="mt-2 flex-row justify-end gap-3">
					<Pressable
						onPress={handleClose}
						disabled={isLoading}
						className={`rounded-md border border-border px-4 py-2 ${
							isLoading ? "opacity-60" : "active:bg-bg-subtle"
						}`}
					>
						<Text className="font-medium text-fg">キャンセル</Text>
					</Pressable>
					<Pressable
						onPress={handleSubmit}
						disabled={isLoading || !url.trim()}
						accessibilityState={{ busy: isLoading }}
						className={`rounded-md bg-accent px-4 py-2 ${
							isLoading || !url.trim() ? "opacity-60" : ""
						}`}
					>
						<Text className="font-medium text-white">
							{isLoading ? "追加中..." : "追加"}
						</Text>
					</Pressable>
				</View>
			</View>
		</Dialog>
	);
}
