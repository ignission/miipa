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
}

/** デフォルトの挨拶文 */
const DEFAULT_GREETING = "おはようございます! 今日の予定をお知らせします。";

export function BriefingCard({ briefing }: BriefingCardProps) {
	const greeting = briefing.greeting ?? DEFAULT_GREETING;

	return (
		<View className="mx-4 mb-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
			{/* AI挨拶文 */}
			<View className="mb-3">
				<Text className="text-sm leading-5 text-neutral-800">{greeting}</Text>
			</View>

			{/* 次の予定 */}
			<NextEventCard nextEvent={briefing.nextEvent} />

			{/* 統計サマリー */}
			<BriefingSummary
				eventCount={briefing.eventCount}
				freeTimeMinutes={briefing.freeTimeMinutes}
				allDayEventCount={briefing.allDayEvents.length}
			/>
		</View>
	);
}
