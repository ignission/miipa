import { useEffect } from "react";
import {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withSpring,
} from "react-native-reanimated";

/**
 * マウント時のスプリングアニメーション（フェードイン＋スライドアップ）
 * @param delay - アニメーション開始までの遅延（スタガー用、デフォルト 0）
 */
export function useEntranceAnimation(delay = 0) {
	const reducedMotion = useReducedMotion();
	const opacity = useSharedValue(reducedMotion ? 1 : 0);
	const translateY = useSharedValue(reducedMotion ? 0 : 30);

	useEffect(() => {
		if (reducedMotion) return;

		const springConfig = { damping: 12, stiffness: 100 };

		opacity.value = withDelay(delay, withSpring(1, springConfig));
		translateY.value = withDelay(delay, withSpring(0, springConfig));
	}, [delay, opacity, translateY, reducedMotion]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return { animatedStyle };
}
