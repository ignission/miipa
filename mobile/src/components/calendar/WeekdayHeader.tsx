import { Dimensions, StyleSheet, Text, View } from "react-native";

const CELL_SIZE = Math.floor(Dimensions.get("window").width / 7);
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

export function WeekdayHeader() {
	return (
		<View style={styles.container}>
			{WEEKDAYS.map((day, index) => (
				<View key={day} style={styles.cell}>
					<Text
						style={[
							styles.text,
							index === 5 && styles.saturdayText,
							index === 6 && styles.sundayText,
						]}
					>
						{day}
					</Text>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F5",
		paddingVertical: 8,
	},
	cell: {
		width: CELL_SIZE,
		alignItems: "center",
	},
	text: {
		fontSize: 12,
		fontWeight: "600",
		color: "#737373",
	},
	saturdayText: {
		color: "#3B82F6",
	},
	sundayText: {
		color: "#EF4444",
	},
});
