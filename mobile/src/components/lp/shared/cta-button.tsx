import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";

interface CTAButtonProps {
	onPress: () => void;
	label: string;
	variant?: "primary" | "secondary";
}

/** CTA ボタン（シャインエフェクト付き） */
export function CTAButton({
	onPress,
	label,
	variant = "primary",
}: CTAButtonProps) {
	const isPrimary = variant === "primary";
	const reduceMotion = useReducedMotion();
	const translateX = useSharedValue(-100);

	useEffect(() => {
		if (!isPrimary || reduceMotion) return;

		translateX.value = withRepeat(
			withSequence(
				withTiming(400, { duration: 1500 }),
				withDelay(4000, withTiming(-100, { duration: 0 })),
			),
			-1,
		);
	}, [isPrimary, reduceMotion, translateX]);

	const shineStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }, { skewX: "-20deg" }],
	}));

	return (
		<Pressable
			onPress={onPress}
			className={
				isPrimary
					? "items-center justify-center overflow-hidden rounded-xl bg-accent px-8 py-4 active:opacity-70"
					: "items-center justify-center rounded-xl border border-border bg-transparent px-8 py-4 active:opacity-70"
			}
		>
			<Text
				className={
					isPrimary
						? "text-lg font-bold text-accent-fg"
						: "text-lg font-bold text-fg"
				}
			>
				{label}
			</Text>

			{isPrimary && !reduceMotion && (
				<Animated.View
					style={[
						{
							position: "absolute",
							top: 0,
							bottom: 0,
							width: 40,
							backgroundColor: "rgba(255,255,255,0.3)",
						},
						shineStyle,
					]}
					pointerEvents="none"
				/>
			)}
		</Pressable>
	);
}
