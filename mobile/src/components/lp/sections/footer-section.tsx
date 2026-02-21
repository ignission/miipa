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
		<View className="px-6 py-8" style={{ backgroundColor: "#1c1917" }}>
			<View className="flex-row flex-wrap justify-center gap-5">
				{links.map((link) => (
					<Pressable
						key={link.href}
						onPress={() => router.push(link.href)}
					>
						<Text style={{ color: "rgba(255,255,255,0.6)" }} className="text-xs">
							{link.label}
						</Text>
					</Pressable>
				))}
			</View>

			<Text
				className="mt-4 text-center text-xs"
				style={{ color: "rgba(255,255,255,0.5)" }}
			>
				© 2025 miipa
			</Text>
		</View>
	);
}
