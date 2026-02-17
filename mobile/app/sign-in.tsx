import { Redirect } from "expo-router";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useAuth } from "../src/auth";

export default function SignInScreen() {
	const { isAuthenticated, isLoading, isSigningIn, signIn } = useAuth();

	// 初期化中はローディング表示
	if (isLoading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color="#F97316" />
			</View>
		);
	}

	// 認証済みならタブ画面にリダイレクト
	if (isAuthenticated) {
		return <Redirect href="/(auth)" />;
	}

	return (
		<View style={styles.container}>
			{/* キャラクターエリア */}
			<View style={styles.characterArea}>
				<Text style={styles.emoji}>🐾</Text>
				<Text style={styles.appName}>miipa</Text>
				<Text style={styles.tagline}>今日の予定を30秒で把握</Text>
			</View>

			{/* ログインボタン */}
			<View style={styles.buttonArea}>
				<Pressable
					style={({ pressed }) => [
						styles.googleButton,
						pressed && styles.googleButtonPressed,
					]}
					onPress={signIn}
					disabled={isSigningIn}
				>
					{isSigningIn ? (
						<ActivityIndicator size="small" color="#fff" />
					) : (
						<Text style={styles.googleButtonText}>Google でログイン</Text>
					)}
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF7ED",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	characterArea: {
		alignItems: "center",
		marginBottom: 48,
	},
	emoji: {
		fontSize: 80,
		marginBottom: 16,
	},
	appName: {
		fontSize: 36,
		fontWeight: "700",
		color: "#EA580C",
		marginBottom: 8,
	},
	tagline: {
		fontSize: 16,
		color: "#9A3412",
		textAlign: "center",
	},
	buttonArea: {
		width: "100%",
		maxWidth: 320,
	},
	googleButton: {
		backgroundColor: "#EA580C",
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	googleButtonPressed: {
		backgroundColor: "#C2410C",
	},
	googleButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
