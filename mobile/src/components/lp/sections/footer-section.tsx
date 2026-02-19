import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

const links = [
	{ label: "プライバシーポリシー", href: "/privacy" },
	{ label: "利用規約", href: "/terms" },
	{ label: "特定商取引法", href: "/tokushoho" },
] as const;

export function FooterSection() {
	const router = useRouter();

	return (
		<View className="border-t border-border bg-bg-canvas px-6 py-8">
			<View className="flex-row flex-wrap justify-center gap-6">
				{links.map((link) => (
					<Pressable
						key={link.href}
						onPress={() => router.push(link.href)}
					>
						<Text className="text-xs text-fg-muted underline">
							{link.label}
						</Text>
					</Pressable>
				))}
			</View>

			<Text className="mt-4 text-center text-xs text-fg-subtle">
				© 2025 miipa
			</Text>
		</View>
	);
}
