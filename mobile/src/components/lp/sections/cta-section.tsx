import { View, Text } from "react-native";
import Animated from "react-native-reanimated";

import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { CTAButton } from "../shared/cta-button";
import { SectionWrapper } from "../shared/section-wrapper";
import { MeerkatPeek } from "../illustrations/meerkat-peek";

interface CTASectionProps {
	onSignIn: () => void;
}

export function CTASection({ onSignIn }: CTASectionProps) {
	const titleAnimation = useEntranceAnimation(0);
	const subtitleAnimation = useEntranceAnimation(100);

	return (
		<SectionWrapper className="bg-accent-50 items-center">
		<Animated.View style={titleAnimation.animatedStyle}>
			<Text className="text-center text-3xl font-black text-fg">
				さあ、はじめよう
			</Text>
		</Animated.View>

			<Animated.View style={subtitleAnimation.animatedStyle}>
				<Text className="mt-2 text-center text-fg-muted">
					30秒で今日を把握する体験を。
				</Text>
			</Animated.View>

			<View className="mt-8">
				<CTAButton
					label="無料ではじめる"
					onPress={onSignIn}
					variant="primary"
				/>
			</View>

			<View className="mt-6 self-center">
				<MeerkatPeek size={80} />
			</View>
		</SectionWrapper>
	);
}
