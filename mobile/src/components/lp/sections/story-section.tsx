import { View, Text } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";

import { useScrollAnimation } from "../animations/use-scroll-animation";
import { SectionWrapper } from "../shared/section-wrapper";
import { MeerkatPeek } from "../illustrations/meerkat-peek";

interface StorySectionProps {
	scrollY: SharedValue<number>;
}

interface StoryCard {
	title: string;
	body: string;
}

const storyCards: StoryCard[] = [
	{
		title: "📅 朝、3つのカレンダーアプリを開く",
		body: "Google、Outlook、iCal… バラバラのカレンダーを行き来して、やっと今日の全体像がつかめる",
	},
	{
		title: "🔄 毎日、同じことの繰り返し",
		body: "カレンダーの確認だけで5分。そのわりに「あれ、今日何時からだっけ？」が減らない",
	},
	{
		title: "✨ miipaなら、開いた瞬間にわかる",
		body: "複数のカレンダーを統合して、AIがあなたの今日を30秒でブリーフィング",
	},
];

const BASE_OFFSET = 600;
const STAGGER = 150;

function StoryCardItem({
	card,
	scrollY,
	index,
}: {
	card: StoryCard;
	scrollY: SharedValue<number>;
	index: number;
}) {
	const { animatedStyle } = useScrollAnimation(
		scrollY,
		BASE_OFFSET + index * STAGGER,
	);

	return (
		<Animated.View
			style={animatedStyle}
			className={`rounded-2xl border p-6 ${
				index === 2
					? "border-accent-200 bg-accent-50"
					: "border-border bg-white"
			}`}
		>
			<Text className="mb-2 text-lg font-bold text-fg">{card.title}</Text>
			<Text className="text-sm leading-relaxed text-fg-muted">{card.body}</Text>
		</Animated.View>
	);
}

export function StorySection({ scrollY }: StorySectionProps) {
	return (
		<SectionWrapper className="bg-bg-canvas">
			<Text className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-accent">
				こんな経験、ありませんか？
			</Text>
			<Text className="mb-8 text-center text-2xl font-black text-fg">
				毎朝のカレンダー確認、{"\n"}もう終わりにしませんか。
			</Text>

			<View className="gap-6">
				{storyCards.map((card, index) => (
					<StoryCardItem
						key={card.title}
						card={card}
						scrollY={scrollY}
						index={index}
					/>
				))}
			</View>

			{/* 覗くミーアキャット */}
			<View className="mt-4 self-end">
				<MeerkatPeek size={80} />
			</View>
		</SectionWrapper>
	);
}
