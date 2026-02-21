import { View, Text } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import { useEntranceAnimation } from "../animations/use-entrance-animation";
import { SectionWrapper } from "../shared/section-wrapper";

interface HowItWorksSectionProps {
	scrollY: SharedValue<number>;
}

const steps = [
	{
		number: "1",
		title: "Googleアカウントでログイン",
		description: "ワンクリックでサインイン。面倒な登録は一切不要。",
	},
	{
		number: "2",
		title: "カレンダーを連携",
		description: "使っているカレンダーを選ぶだけ。複数アカウントもOK。",
	},
	{
		number: "3",
		title: "今日を把握する",
		description: "統合されたカレンダーとAIで、今日が一瞬でわかる。",
	},
];

function StepItem({
	number,
	title,
	description,
	index,
}: {
	number: string;
	title: string;
	description: string;
	index: number;
}) {
	const { animatedStyle } = useEntranceAnimation(index * 150);

	return (
		<Animated.View style={[animatedStyle, { flexDirection: "row", alignItems: "flex-start", gap: 16 }]}>
			{/* 番号バッジ */}
			<View className="w-10 h-10 rounded-full bg-accent items-center justify-center">
				<Text className="text-white font-black">{number}</Text>
			</View>

			{/* テキスト */}
			<View className="flex-1 pb-8">
				<Text className="text-base font-bold text-fg">{title}</Text>
				<Text className="text-sm text-fg-muted mt-1">{description}</Text>
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
			<Text className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-accent">
				How it works
			</Text>
			<Text className="mb-2 text-center text-2xl font-black text-fg">
				かんたん３ステップ
			</Text>
			<Text className="mb-10 text-center text-sm text-fg-muted">
				登録から使い始めるまで、たったの30秒。
			</Text>

			{steps.map((step, index) => (
				<View key={step.number}>
					<StepItem
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
