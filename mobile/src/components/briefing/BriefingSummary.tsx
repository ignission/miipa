/**
 * ブリーフィングサマリー
 *
 * イベント数、空き時間、終日イベント数を水平バッジで表示します。
 */

import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

interface BriefingSummaryProps {
	/** 今日のイベント総数 */
	eventCount: number;
	/** 空き時間（分） */
	freeTimeMinutes: number;
	/** 終日イベント数 */
	allDayEventCount: number;
}

/**
 * 空き時間を読みやすい形式にフォーマット
 */
function formatFreeTime(minutes: number): string {
	if (minutes < 60) {
		return `${minutes}分`;
	}
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	if (remainingMinutes === 0) {
		return `${hours}時間`;
	}
	return `${hours}h${remainingMinutes}m`;
}

/**
 * 統計バッジコンポーネント
 */
function StatBadge({
	icon,
	label,
}: {
	icon: ComponentProps<typeof Ionicons>["name"];
	label: string;
}) {
	return (
		<View className="flex-row items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
			<Ionicons name={icon} size={14} color="#F97316" />
			<Text className="text-xs font-medium text-neutral-700">{label}</Text>
		</View>
	);
}

export function BriefingSummary({
	eventCount,
	freeTimeMinutes,
	allDayEventCount,
}: BriefingSummaryProps) {
	return (
		<View className="flex-row flex-wrap gap-2">
			<StatBadge icon="calendar-outline" label={`${eventCount}件の予定`} />
			<StatBadge
				icon="time-outline"
				label={`空き${formatFreeTime(freeTimeMinutes)}`}
			/>
			{allDayEventCount > 0 && (
				<StatBadge icon="sunny-outline" label={`終日${allDayEventCount}件`} />
			)}
		</View>
	);
}
