import { View, Text } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import { LogIn, Link, Eye } from "lucide-react-native";
import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { SectionWrapper } from "../shared/section-wrapper";

interface HowItWorksSectionProps {
	scrollY: SharedValue<number>;
}

const steps = [
	{
		icon: LogIn,
		number: "1",
		title: "ログイン",
		description: "Googleアカウントでかんたんログイン",
	},
	{
		icon: Link,
		number: "2",
		title: "カレンダー連携",
		description: "使っているカレンダーを追加するだけ",
	},
	{
		icon: Eye,
		number: "3",
		title: "今日を把握",
		description: "統合されたカレンダーとAIで今日がわかる",
	},
] as const;

function StepItem({
	icon: Icon,
	number,
	title,
	description,
	index,
}: {
	icon: (typeof steps)[number]["icon"];
	number: string;
	title: string;
	description: string;
	index: number;
}) {
	const { animatedStyle } = useEntranceAnimation(index * 150);

	return (
		<Animated.View style={animatedStyle} className="flex-row items-start gap-4">
			{/* 番号バッジ */}
			<View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
				<Text className="text-white font-bold">{number}</Text>
			</View>

			{/* テキストとアイコン */}
			<View className="flex-1">
				<Text className="text-base font-bold text-fg">{title}</Text>
				<Text className="text-sm text-fg-muted mt-1">{description}</Text>
				<Icon size={20} color="#78716c" style={{ marginTop: 8 }} />
			</View>
		</Animated.View>
	);
}

/** ステップ間の破線コネクタ */
function DashedConnector() {
	return (
		<View className="h-8 ml-5 border-l-2 border-dashed border-accent-200" />
	);
}

export function HowItWorksSection({
	scrollY: _scrollY,
}: HowItWorksSectionProps) {
	return (
		<SectionWrapper className="bg-accent-50">
			<Text className="text-2xl font-bold text-fg text-center mb-10">
				かんたん3ステップ
			</Text>

			{steps.map((step, index) => (
				<View key={step.number}>
					<StepItem
						icon={step.icon}
						number={step.number}
						title={step.title}
						description={step.description}
						index={index}
					/>
					{index < steps.length - 1 && <DashedConnector />}
				</View>
			))}
		</SectionWrapper>
	);
}
