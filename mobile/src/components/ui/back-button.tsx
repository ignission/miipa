/**
 * BackButtonコンポーネント
 *
 * expo-router の router.back() を使用して前のページに戻るボタンです。
 * Web版の Next.js useRouter().back() から移行しています。
 *
 * @module components/ui/back-button
 *
 * @example
 * ```tsx
 * <BackButton />
 * <BackButton label="設定に戻る" />
 * ```
 */

import { router } from "expo-router";
import { Pressable, Text } from "react-native";

/**
 * BackButtonコンポーネントのProps
 */
interface BackButtonProps {
	/** ボタンのラベルテキスト（デフォルト: "← 戻る"） */
	label?: string;
}

/**
 * 戻るボタンコンポーネント
 *
 * タップすると前の画面に戻ります。
 *
 * @param props - コンポーネントのProps
 * @returns 戻るボタン要素
 */
export function BackButton({ label = "← 戻る" }: BackButtonProps) {
	return (
		<Pressable
			className="self-start active:opacity-70"
			onPress={() => router.back()}
			accessibilityRole="button"
			accessibilityLabel="前のページに戻る"
		>
			<Text className="text-sm text-fg-muted">{label}</Text>
		</Pressable>
	);
}
