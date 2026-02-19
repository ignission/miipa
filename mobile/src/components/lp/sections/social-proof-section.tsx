import { View, Text } from "react-native";
import Animated from "react-native-reanimated";
import { Cloud, Key, Lock } from "lucide-react-native";

import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { SectionWrapper } from "../shared/section-wrapper";

const badges = [
	{ icon: Cloud, text: "Cloudflare Workers で安全に動作" },
	{ icon: Key, text: "Google Calendar 公式API" },
	{ icon: Lock, text: "データは暗号化して保存" },
] as const;

export function SocialProofSection() {
	return (
		<SectionWrapper>
			<View className="flex-row flex-wrap justify-center gap-6">
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
	const Icon = badge.icon;

	return (
		<Animated.View style={animatedStyle} className="items-center gap-2">
			<Icon size={20} color="#78716c" />
			<Text className="max-w-[120px] text-center text-xs text-fg-muted">
				{badge.text}
			</Text>
		</Animated.View>
	);
}
