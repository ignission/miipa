import { Dimensions, StyleSheet, Text, View } from "react-native";

const CELL_SIZE = Math.floor(Dimensions.get("window").width / 7);
const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

/**
 * 曜日ヘッダーコンポーネント
 *
 * カレンダーグリッドの上部に月〜日の曜日ラベルを表示します。
 * 土曜日は青色、日曜日は赤色で表示されます。
 */
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
