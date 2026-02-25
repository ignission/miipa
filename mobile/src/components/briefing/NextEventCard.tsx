/**
 * 次の予定カード
 *
 * 次に控えている予定とカウントダウンを表示します。
 * 予定がない場合は「残りの予定はありません」を表示します。
 */

import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface NextEventProps {
	nextEvent: {
		title: string;
		startTime: string;
		endTime: string;
		location: string | null;
	} | null;
	/** 現在時刻（毎分更新）。カウントダウンをクライアント側で計算するために使用 */
	currentTime: Date;
}

/**
 * カウントダウンテキストをフォーマット
 */
function formatCountdown(minutes: number): string {
	if (minutes < 0) {
		return "開催中";
	}
	if (minutes < 1) {
		return "まもなく開始";
	}
	if (minutes < 60) {
		return `あと${Math.round(minutes)}分`;
	}
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = Math.floor(minutes % 60);
	if (remainingMinutes === 0) {
		return `あと${hours}時間`;
	}
	return `あと${hours}時間${remainingMinutes}分`;
}

/**
 * 時刻フォーマット（HH:MM）
 */
function formatTime(isoString: string): string {
	return new Date(isoString).toLocaleTimeString("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

export function NextEventCard({ nextEvent, currentTime }: NextEventProps) {
	if (!nextEvent) {
		return (
			<View className="mb-2 flex-row items-center gap-2 rounded-xl bg-white/60 px-3 py-2.5">
				<Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
				<Text className="text-sm text-neutral-500">
					今日の残りの予定はありません
				</Text>
			</View>
		);
	}

	// currentTimeからリアルタイムにminutesUntilを算出
	const minutesUntil =
		(new Date(nextEvent.startTime).getTime() - currentTime.getTime()) / 60_000;

	return (
		<View className="mb-2 flex-row items-center gap-3 rounded-xl bg-white/60 px-3 py-2.5">
			{/* カウントダウンバッジ */}
			<View className="items-center justify-center rounded-full bg-orange-500 px-2 py-1">
				<Text className="text-[11px] font-bold text-white">
					{formatCountdown(minutesUntil)}
				</Text>
			</View>

			{/* イベント情報 */}
			<View className="flex-1">
				<Text
					className="text-sm font-semibold text-neutral-900"
					numberOfLines={1}
				>
					{nextEvent.title}
				</Text>
				<View className="flex-row items-center gap-1">
					<Text className="text-xs text-neutral-500">
						{formatTime(nextEvent.startTime)} - {formatTime(nextEvent.endTime)}
					</Text>
					{nextEvent.location && (
						<Text className="text-xs text-neutral-400" numberOfLines={1}>
							{" "}
							| {nextEvent.location}
						</Text>
					)}
				</View>
			</View>
		</View>
	);
}
