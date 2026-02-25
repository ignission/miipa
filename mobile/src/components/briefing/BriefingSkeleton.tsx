/**
 * ブリーフィングスケルトン
 *
 * ブリーフィングデータ読み込み中に表示するプレースホルダーです。
 * パルスアニメーションでローディング状態を視覚的に伝えます。
 */

import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

/**
 * パルスアニメーション付きのスケルトンブロック
 */
function SkeletonBlock({ className }: { className: string }) {
	const opacity = useRef(new Animated.Value(0.3)).current;

	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 0.3,
					duration: 800,
					useNativeDriver: true,
				}),
			]),
		);
		animation.start();
		return () => animation.stop();
	}, [opacity]);

	return (
		<Animated.View
			className={`rounded-md bg-orange-100 ${className}`}
			style={{ opacity }}
		/>
	);
}

/**
 * ブリーフィングカードのスケルトンローダー
 */
export function BriefingSkeleton() {
	return (
		<View className="mx-4 mb-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
			{/* 挨拶文スケルトン */}
			<SkeletonBlock className="mb-3 h-4 w-3/4" />
			<SkeletonBlock className="mb-4 h-3 w-1/2" />

			{/* 次の予定スケルトン */}
			<View className="mb-3 flex-row items-center gap-2">
				<SkeletonBlock className="h-8 w-8 rounded-full" />
				<View className="flex-1 gap-1">
					<SkeletonBlock className="h-3.5 w-2/3" />
					<SkeletonBlock className="h-3 w-1/3" />
				</View>
			</View>

			{/* サマリーバッジスケルトン */}
			<View className="flex-row gap-2">
				<SkeletonBlock className="h-7 flex-1 rounded-full" />
				<SkeletonBlock className="h-7 flex-1 rounded-full" />
				<SkeletonBlock className="h-7 flex-1 rounded-full" />
			</View>
		</View>
	);
}
