import { View, Text } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { SectionWrapper } from "../shared/section-wrapper";
import { DotPattern } from "../illustrations/dot-pattern";

interface FeaturesSectionProps {
	scrollY: SharedValue<number>;
}

const features = [
	{
		emoji: "📅",
		title: "カレンダー統合",
		description: "Google、iCal など複数のカレンダーをひとつにまとめて表示。",
	},
	{
		emoji: "✨",
		title: "AI質問応答",
		description: "「今日の予定は？」「来週の空き時間は？」AIに聞くだけ。",
	},
	{
		emoji: "🛡️",
		title: "安心のセキュリティ",
		description: "データは暗号化して保存。カレンダーは読み取り専用。",
	},
	{
		emoji: "⚡",
		title: "30秒で把握",
		description: "開いた瞬間に今日の全体像がわかる、ダッシュボード設計。",
	},
];

function FeatureCard({
	emoji,
	title,
	description,
	index,
}: {
	emoji: string;
	title: string;
	description: string;
	index: number;
}) {
	const { animatedStyle } = useEntranceAnimation(index * 100);

	return (
		<Animated.View
			style={[animatedStyle, { flexDirection: "row", alignItems: "flex-start", gap: 16 }]}
			className="bg-bg-canvas rounded-2xl p-5 border border-border"
		>
			<View className="w-12 h-12 rounded-xl bg-accent-50 items-center justify-center">
				<Text className="text-xl">{emoji}</Text>
			</View>
			<View className="flex-1">
				<Text className="text-base font-bold text-fg">{title}</Text>
				<Text className="text-sm text-fg-muted mt-1">{description}</Text>
			</View>
		</Animated.View>
	);
}

export function FeaturesSection({ scrollY: _scrollY }: FeaturesSectionProps) {
	return (
		<SectionWrapper>
			<View className="relative overflow-hidden">
				{/* デコレーション用ドットパターン */}
				<View className="absolute top-0 right-0 opacity-30">
					<DotPattern width={150} height={150} />
				</View>

				<Text className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-accent">
					Features
				</Text>
				<Text className="mb-2 text-center text-2xl font-black text-fg">
					miipaの特徴
				</Text>
				<Text className="mb-8 text-center text-sm text-fg-muted">
					一人社長のための、シンプルで賢いカレンダー管理。
				</Text>

				<View className="gap-4">
					{features.map((feature, index) => (
						<FeatureCard
							key={feature.title}
							emoji={feature.emoji}
							title={feature.title}
							description={feature.description}
							index={index}
						/>
					))}
				</View>
			</View>
		</SectionWrapper>
	);
}
