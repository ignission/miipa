import { Image, Platform, Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { useEntranceAnimation } from "../animations/use-entrance-animation";

interface CTASectionProps {
	onSignIn: () => void;
}

export function CTASection({ onSignIn }: CTASectionProps) {
	const titleAnimation = useEntranceAnimation(0);
	const subtitleAnimation = useEntranceAnimation(100);

	return (
		<View
			className="items-center px-6 py-20 overflow-hidden"
			style={
				Platform.OS === "web"
					? ({
							background: "linear-gradient(135deg, #FF6B4A 0%, #FF9A3C 100%)",
						} as any)
					: { backgroundColor: "#FF6B4A" }
			}
		>
			{/* ミーアキャットアイコン */}
			<Image
				source={require("../../../../assets/images/icon-new.png")}
				style={{
					width: 80,
					height: 80,
					borderRadius: 20,
					marginBottom: 20,
					...(Platform.OS === "web"
						? ({ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" } as object)
						: {}),
				}}
			/>

			<Animated.View style={titleAnimation.animatedStyle}>
				<Text className="text-center text-3xl font-black text-white">
					さあ、はじめよう
				</Text>
			</Animated.View>

			<Animated.View style={subtitleAnimation.animatedStyle}>
				<Text
					className="mt-2 text-center"
					style={{ color: "rgba(255,255,255,0.85)" }}
				>
					30秒で今日を把握する体験を。
				</Text>
			</Animated.View>

			{/* 白ボタン */}
			<Pressable
				onPress={onSignIn}
				className="mt-8 rounded-full bg-white px-8 py-4 active:opacity-70"
				style={
					Platform.OS === "web"
						? ({
								boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
							} as any)
						: {}
				}
			>
				<Text style={{ color: "#FF6B4A" }} className="text-lg font-bold">
					無料ではじめる
				</Text>
			</Pressable>
		</View>
	);
}
