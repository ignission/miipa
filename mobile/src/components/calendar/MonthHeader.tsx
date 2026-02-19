import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

/** 月ヘッダーコンポーネントのProps */
interface MonthHeaderProps {
	/** 年 */
	year: number;
	/** 月（1〜12） */
	month: number;
	/** 前月へ移動するコールバック */
	onPrevMonth: () => void;
	/** 次月へ移動するコールバック */
	onNextMonth: () => void;
}

/**
 * 月ヘッダーコンポーネント
 *
 * 「YYYY年MM月」のタイトルと前月・次月への
 * ナビゲーションボタンを表示します。
 */
export function MonthHeader({
	year,
	month,
	onPrevMonth,
	onNextMonth,
}: MonthHeaderProps) {
	return (
		<View style={styles.container}>
			<Pressable
				onPress={onPrevMonth}
				style={styles.button}
				accessibilityLabel="前月"
			>
				<Ionicons name="chevron-back" size={24} color="#404040" />
			</Pressable>
			<Text style={styles.title}>
				{year}年{month}月
			</Text>
			<Pressable
				onPress={onNextMonth}
				style={styles.button}
				accessibilityLabel="次月"
			>
				<Ionicons name="chevron-forward" size={24} color="#404040" />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	button: {
		padding: 8,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#171717",
	},
});
