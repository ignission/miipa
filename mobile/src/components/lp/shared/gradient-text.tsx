import { Platform, Text, View } from "react-native";

interface GradientTextProps {
	children: string;
	className?: string;
}

/** グラデーションテキスト（Web: CSS gradient / Native: accent カラー） */
export function GradientText({ children, className = "" }: GradientTextProps) {
	if (Platform.OS === "web") {
		return (
			<View>
				<Text
					className={className}
					style={
						{
							backgroundImage: "linear-gradient(135deg, #F97316, #EA580C)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						} as unknown as import("react-native").TextStyle
					}
				>
					{children}
				</Text>
			</View>
		);
	}

	return <Text className={`text-accent ${className}`.trim()}>{children}</Text>;
}
