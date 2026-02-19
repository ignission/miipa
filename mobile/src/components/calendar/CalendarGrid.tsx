import { StyleSheet, View } from "react-native";
import type { CalendarDay } from "../../lib/calendar-utils";
import { DayCell } from "./DayCell";

/** カレンダーグリッドコンポーネントのProps */
interface CalendarGridProps {
	/** カレンダーの日付データ配列（前月・翌月の補完を含む） */
	grid: CalendarDay[];
	/** 選択中の日付キー（YYYY-MM-DD形式） */
	selectedDateKey: string;
	/** イベントが存在する日付キーのセット */
	eventDateKeys: Set<string>;
	/** 日付が押されたときのコールバック */
	onDayPress: (day: CalendarDay) => void;
}

/**
 * カレンダーグリッドコンポーネント
 *
 * 月のカレンダーグリッドを描画し、各日付セルを配置します。
 * 選択状態やイベントの有無を各セルに反映します。
 */
export function CalendarGrid({
	grid,
	selectedDateKey,
	eventDateKeys,
	onDayPress,
}: CalendarGridProps) {
	return (
		<View style={styles.grid}>
			{grid.map((day) => (
				<DayCell
					key={day.dateKey}
					day={day}
					isSelected={day.dateKey === selectedDateKey}
					hasEvents={eventDateKeys.has(day.dateKey)}
					onPress={onDayPress}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
});
