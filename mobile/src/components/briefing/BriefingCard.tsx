/**
 * ブリーフィングカード
 *
 * 今日の予定サマリーを表示するメインカードです。
 * AI挨拶文、次の予定、統計バッジを含みます。
 */

import type { BriefingResponse } from "@miipa/shared";
import { Text, View } from "react-native";
import { BriefingSummary } from "./BriefingSummary";
import { NextEventCard } from "./NextEventCard";

interface BriefingCardProps {
	briefing: BriefingResponse;
	/** 現在時刻（毎分更新）。NextEventCardのカウントダウン算出に使用 */
	currentTime: Date;
}

/** デフォルトの挨拶文 */
const DEFAULT_GREETING = "おはようございます! 今日の予定をお知らせします。";

export function BriefingCard({ briefing, currentTime }: BriefingCardProps) {
	const greeting = briefing.greeting ?? DEFAULT_GREETING;

	return (
		<View className="mx-4 mb-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
			{/* AI挨拶文 */}
			<View className="mb-3">
				<Text className="text-sm leading-5 text-neutral-800">{greeting}</Text>
			</View>

			{/* 次の予定 */}
			<NextEventCard nextEvent={briefing.nextEvent} currentTime={currentTime} />

			{/* 統計サマリー */}
			<BriefingSummary
				eventCount={briefing.eventCount}
				freeTimeMinutes={briefing.freeTimeMinutes}
				allDayEventCount={briefing.allDayEvents.length}
			/>
		</View>
	);
}
