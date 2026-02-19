import { Redirect, router } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "../src/auth";
import { LandingPage } from "../src/components/lp/landing-page";

export default function IndexScreen() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-bg-canvas">
				<Text className="text-fg-muted">読み込み中...</Text>
			</View>
		);
	}

	if (isAuthenticated) {
		return <Redirect href="/(auth)/home" />;
	}

	return (
		<LandingPage
			onSignIn={() => {
				router.push("/sign-in");
			}}
		/>
	);
}
