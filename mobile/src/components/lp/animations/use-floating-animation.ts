import { useEffect } from "react";
import {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";

/**
 * ゆるやかなフローティング（上下揺れ）アニメーション
 * @param amplitude - 揺れ幅（デフォルト 8）
 * @param duration - 片道の所要時間（デフォルト 3000ms）
 */
export function useFloatingAnimation(amplitude = 8, duration = 3000) {
	const reducedMotion = useReducedMotion();
	const translateY = useSharedValue(0);

	useEffect(() => {
		if (reducedMotion) return;

		translateY.value = withRepeat(
			withTiming(-amplitude, {
				duration,
				easing: Easing.inOut(Easing.ease),
			}),
			-1,
			true,
		);
	}, [amplitude, duration, translateY, reducedMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	return { animatedStyle };
}
