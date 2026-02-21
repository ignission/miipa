import { View, Text } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";

import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { SectionWrapper } from "../shared/section-wrapper";

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
		body: "Google、iCal… バラバラのカレンダーを行き来して、やっと今日の全体像がつかめる。",
	},
	{
		title: "🔄 毎日、同じことの繰り返し",
		body: "カレンダーの確認だけで5分。そのわりに「あれ、今日何時からだっけ？」が減らない。",
	},
	{
		title: "✨ miipaなら、開いた瞬間にわかる",
		body: "複数のカレンダーを統合して、AIがあなたの今日を30秒でブリーフィング。",
	},
];

function StoryCardItem({
	card,
	index,
}: {
	card: StoryCard;
	index: number;
}) {
	const { animatedStyle } = useEntranceAnimation(index * 150);

	return (
		<Animated.View
			style={[
				animatedStyle,
				{
					borderRadius: 16,
					borderWidth: 1,
					padding: 24,
					borderColor: index === 2 ? "#FED7AA" : "#d6d3d1",
					backgroundColor: index === 2 ? "#FFF7ED" : "#ffffff",
				},
			]}
		>
			<Text className="mb-2 text-lg font-bold text-fg">{card.title}</Text>
			<Text className="text-sm leading-relaxed text-fg-muted">{card.body}</Text>
		</Animated.View>
	);
}

export function StorySection({ scrollY: _scrollY }: StorySectionProps) {
	return (
		<SectionWrapper className="bg-bg-canvas">
			<Text className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-accent">
				こんな経験、ありませんか？
			</Text>
			<Text className="mb-8 text-center text-2xl font-black text-fg">
				毎朝のカレンダー確認、{"\n"}もう終わりにしませんか。
			</Text>

			<View className="gap-4">
				{storyCards.map((card, index) => (
					<StoryCardItem
						key={card.title}
						card={card}
						index={index}
					/>
				))}
			</View>

			<View className="mt-4 self-end">
				<View className="w-16 h-16 rounded-full bg-accent-100 items-center justify-center">
					<Text className="text-3xl">🐾</Text>
				</View>
			</View>
		</SectionWrapper>
	);
}
