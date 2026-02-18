import { ScrollView, Text, View } from "react-native";

export default function TermsScreen() {
	return (
		<ScrollView className="flex-1 bg-bg-canvas p-6">
			<View className="mx-auto max-w-2xl">
				<Text className="text-2xl font-bold text-fg">利用規約</Text>
				<Text className="mt-4 text-fg-muted">準備中</Text>
			</View>
		</ScrollView>
	);
}
