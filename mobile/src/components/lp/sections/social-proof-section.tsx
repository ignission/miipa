import { View, Text } from "react-native";
import Animated from "react-native-reanimated";

import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { SectionWrapper } from "../shared/section-wrapper";

const badges = [
	{ emoji: "☁️", text: "Cloudflare Workers で動作" },
	{ emoji: "🔑", text: "Google Calendar 公式API" },
	{ emoji: "🔒", text: "データは暗号化して保存" },
	{ emoji: "👁️", text: "読み取り専用・変更なし" },
];

export function SocialProofSection() {
	return (
		<SectionWrapper>
			<Text className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-accent">
				Trust &amp; Security
			</Text>
			<Text className="mb-8 text-center text-2xl font-black text-fg">
				安心して使える理由
			</Text>
			<View className="flex-row flex-wrap justify-center gap-3">
				{badges.map((badge, index) => (
					<Badge key={badge.text} badge={badge} index={index} />
				))}
			</View>
		</SectionWrapper>
	);
}

function Badge({
	badge,
	index,
}: {
	badge: (typeof badges)[number];
	index: number;
}) {
	const { animatedStyle } = useEntranceAnimation(index * 100);

	return (
		<Animated.View
			style={animatedStyle}
			className="flex-row items-center gap-2 rounded-full bg-bg-subtle border border-border px-4 py-2.5"
		>
			<Text className="text-base">{badge.emoji}</Text>
			<Text className="text-xs font-medium text-fg-muted">{badge.text}</Text>
		</Animated.View>
	);
}
