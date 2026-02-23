import { Image, Platform, Text, View } from "react-native";
import Animated, {
	interpolate,
	type SharedValue,
	useAnimatedStyle,
} from "react-native-reanimated";

import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { useFloatingAnimation } from "../animations/use-floating-animation";
import { SunRays } from "../illustrations/sun-rays";
import { CTAButton } from "../shared/cta-button";
import { GradientText } from "../shared/gradient-text";

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
		transform: [
			{ translateY: interpolate(scrollY.value, [0, 500], [0, -250]) },
		],
	}));

	return (
		<View className="w-full items-center bg-accent-50 pb-16 pt-16">
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

					{/* ミーアキャットアイコン（フローティング） */}
					<Animated.View style={floatingAnimation.animatedStyle}>
						<Image
							source={require("../../../../assets/images/icon-new.png")}
							style={{
								width: 160,
								height: 160,
								borderRadius: 40,
								...(Platform.OS === "web"
									? ({
											boxShadow: "0 12px 40px rgba(255,107,74,0.25)",
										} as object)
									: {}),
							}}
						/>
					</Animated.View>
				</View>
			</Animated.View>

			{/* バッジ */}
			<Animated.View
				style={taglineAnimation.animatedStyle}
				className="mt-6 flex-row items-center gap-1 rounded-full bg-accent-100 px-3 py-1"
			>
				<Text className="text-sm">🐾</Text>
				<Text className="text-xs font-bold text-accent">
					ミーアキャットが今日をサポート
				</Text>
			</Animated.View>

			{/* タグライン */}
			<Animated.View
				style={subtitleAnimation.animatedStyle}
				className="mt-4 px-6"
			>
				<GradientText className="text-center text-4xl font-black">
					今日のあなたを、30秒で把握。
				</GradientText>
			</Animated.View>

			{/* サブタイトル */}
			<Animated.View style={ctaAnimation.animatedStyle} className="mt-3 px-8">
				<Text className="text-center text-base text-fg-muted leading-relaxed">
					複数のGoogleカレンダーを統合して、{"\n"}
					AIがあなたの一日をブリーフィング。
				</Text>
			</Animated.View>

			{/* CTA ボタン */}
			<Animated.View style={taglineAnimation.animatedStyle} className="mt-8">
				<CTAButton label="Googleではじめる（無料）" onPress={onSignIn} />
			</Animated.View>

			{/* 補足テキスト */}
			<Animated.View style={taglineAnimation.animatedStyle} className="mt-3">
				<Text className="text-xs text-fg-subtle text-center">
					クレジットカード不要 · 30秒でセットアップ
				</Text>
			</Animated.View>
		</View>
	);
}
