import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface MonthHeaderProps {
	year: number;
	month: number;
	onPrevMonth: () => void;
	onNextMonth: () => void;
}

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
