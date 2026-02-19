import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

interface SunRaysProps {
	/** スケーリング用サイズ（デフォルト 300） */
	size?: number;
}

/** 放射状の光線アニメーション（ミーアキャットの背景用） */
export function SunRays({ size = 300 }: SunRaysProps) {
	const reducedMotion = useReducedMotion();
	const rotation = useSharedValue(0);

	useEffect(() => {
		if (reducedMotion) return;

		rotation.value = withRepeat(
			withTiming(360, {
				duration: 30000,
				easing: Easing.linear,
			}),
			-1,
			false,
		);
	}, [reducedMotion, rotation]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	const center = size / 2;
	const rayCount = 10;
	const outerRadius = size / 2;
	const rayHalfAngle = Math.PI / rayCount / 2;

	// 三角形の光線パスを生成
	const rays: string[] = [];
	for (let i = 0; i < rayCount; i++) {
		const angle = (i * 2 * Math.PI) / rayCount;
		const x1 = center + outerRadius * Math.cos(angle - rayHalfAngle);
		const y1 = center + outerRadius * Math.sin(angle - rayHalfAngle);
		const x2 = center + outerRadius * Math.cos(angle + rayHalfAngle);
		const y2 = center + outerRadius * Math.sin(angle + rayHalfAngle);
		rays.push(`M${center},${center} L${x1},${y1} L${x2},${y2} Z`);
	}

	const Wrapper = reducedMotion ? View : Animated.View;
	const wrapperStyle = reducedMotion ? undefined : animatedStyle;

	return (
		<Wrapper
			style={[{ width: size, height: size }, wrapperStyle]}
			pointerEvents="none"
		>
			<Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
				{rays.map((d) => (
					<Path key={d} d={d} fill="#FED7AA" opacity={0.3} />
				))}
			</Svg>
		</Wrapper>
	);
}
