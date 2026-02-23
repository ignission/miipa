import {
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	withTiming,
} from "react-native-reanimated";

/**
 * スクロール位置に応じたフェードイン＋スライドアップアニメーション
 * @param scrollY - スクロール位置の SharedValue
 * @param triggerOffset - アニメーション開始する Y 座標
 */
export function useScrollAnimation(
	scrollY: SharedValue<number>,
	triggerOffset: number,
) {
	const reducedMotion = useReducedMotion();

	const animatedStyle = useAnimatedStyle(() => {
		if (reducedMotion) {
			return { opacity: 1, transform: [{ translateY: 0 }] };
		}

		const isTriggered = scrollY.value >= triggerOffset;

		return {
			opacity: withTiming(isTriggered ? 1 : 0, { duration: 600 }),
			transform: [
				{
					translateY: withTiming(isTriggered ? 0 : 40, { duration: 600 }),
				},
			],
		};
	});

	return { animatedStyle };
}
