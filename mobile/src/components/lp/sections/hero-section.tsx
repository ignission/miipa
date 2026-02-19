import { View, Text } from "react-native";
import Animated, {
	useAnimatedStyle,
	interpolate,
	type SharedValue,
} from "react-native-reanimated";

import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { useFloatingAnimation } from "../animations/use-floating-animation";
import { CTAButton } from "../shared/cta-button";
import { GradientText } from "../shared/gradient-text";
import { MeerkatHero } from "../illustrations/meerkat-hero";
import { SunRays } from "../illustrations/sun-rays";

interface HeroSectionProps {
	onSignIn: () => void;
	scrollY: SharedValue<number>;
}

export function HeroSection({ onSignIn, scrollY }: HeroSectionProps) {
	const floatingAnimation = useFloatingAnimation();
	const taglineAnimation = useEntranceAnimation(0);
	const subtitleAnimation = useEntranceAnimation(200);
	const ctaAnimation = useEntranceAnimation(400);

	const parallaxStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: interpolate(scrollY.value, [0, 500], [0, -250]) }],
	}));

	return (
		<View className="w-full items-center bg-accent-50 pb-12 pt-16">
			{/* ミーアキャット + SunRays */}
			<Animated.View
				style={parallaxStyle}
				className="items-center justify-center"
			>
				<View className="items-center justify-center">
					{/* SunRays（背景） */}
					<View className="absolute items-center justify-center">
						<SunRays size={300} />
					</View>

					{/* ミーアキャット（フローティング） */}
					<Animated.View style={floatingAnimation.animatedStyle}>
						<MeerkatHero size={200} />
					</Animated.View>
				</View>
			</Animated.View>

			{/* タグライン */}
			<Animated.View style={taglineAnimation.animatedStyle} className="mt-6">
				<GradientText className="text-center text-3xl font-bold">
					今日のあなたを、30秒で把握。
				</GradientText>
			</Animated.View>

			{/* サブタイトル */}
			<Animated.View
				style={subtitleAnimation.animatedStyle}
				className="mt-3 px-6"
			>
				<Text className="text-center text-base text-fg-muted">
					複数カレンダーを統合して、ミーアキャットがあなたの1日をサポート
				</Text>
			</Animated.View>

			{/* CTA ボタン */}
			<Animated.View style={ctaAnimation.animatedStyle} className="mt-8">
				<CTAButton label="はじめる" onPress={onSignIn} />
			</Animated.View>
		</View>
	);
}
