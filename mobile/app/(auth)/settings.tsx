import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { useAuth } from "../../src/auth";
import { useCalendars, useSyncCalendars } from "../../src/hooks/useCalendars";

export default function SettingsScreen() {
	const { user, signOut } = useAuth();
	const { data: calendars, isLoading: isLoadingCalendars } = useCalendars();
	const syncMutation = useSyncCalendars();

	return (
		<ScrollView style={styles.container}>
			{/* アカウント情報 */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>アカウント</Text>
				{user && (
					<View style={styles.card}>
						<Text style={styles.userName}>
							{user.name ?? "ユーザー"}
						</Text>
						<Text style={styles.userEmail}>{user.email}</Text>
					</View>
				)}
			</View>

			{/* カレンダー一覧 */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>カレンダー</Text>
					<Pressable
						style={({ pressed }) => [
							styles.syncButton,
							pressed && styles.syncButtonPressed,
						]}
						onPress={() => syncMutation.mutate()}
						disabled={syncMutation.isPending}
					>
						{syncMutation.isPending ? (
							<ActivityIndicator size="small" color="#F97316" />
						) : (
							<Text style={styles.syncButtonText}>同期</Text>
						)}
					</Pressable>
				</View>

				{isLoadingCalendars ? (
					<ActivityIndicator
						size="small"
						color="#F97316"
						style={styles.calendarLoading}
					/>
				) : calendars && calendars.length > 0 ? (
					<View style={styles.card}>
						{calendars.map((calendar, index) => (
							<View
								key={calendar.id}
								style={[
									styles.calendarRow,
									index < calendars.length - 1 &&
										styles.calendarRowBorder,
								]}
							>
								<View style={styles.calendarInfo}>
									<View
										style={[
											styles.calendarDot,
											{ backgroundColor: calendar.color },
										]}
									/>
									<View style={styles.calendarTextWrap}>
										<Text
											style={styles.calendarName}
											numberOfLines={1}
										>
											{calendar.name}
										</Text>
										{calendar.accountEmail && (
											<Text
												style={styles.calendarEmail}
												numberOfLines={1}
											>
												{calendar.accountEmail}
											</Text>
										)}
									</View>
								</View>
								{/* TODO: バックエンドにカレンダーのenabled切り替えAPI実装後に有効化 */}
								<Switch
									value={calendar.enabled}
									disabled
									trackColor={{
										false: "#D4D4D4",
										true: "#FDBA74",
									}}
									thumbColor={
										calendar.enabled ? "#F97316" : "#f4f3f4"
									}
								/>
							</View>
						))}
					</View>
				) : (
					<View style={styles.card}>
						<Text style={styles.noCalendars}>
							カレンダーが見つかりません
						</Text>
					</View>
				)}
			</View>

			{/* ログアウト */}
			<View style={styles.section}>
				<Pressable
					style={({ pressed }) => [
						styles.logoutButton,
						pressed && styles.logoutButtonPressed,
					]}
					onPress={signOut}
				>
					<Text style={styles.logoutButtonText}>ログアウト</Text>
				</Pressable>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FAFAFA",
	},
	section: {
		marginTop: 24,
		paddingHorizontal: 16,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "600",
		color: "#737373",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: 8,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 1,
	},
	userName: {
		fontSize: 18,
		fontWeight: "600",
		color: "#171717",
		marginBottom: 4,
	},
	userEmail: {
		fontSize: 14,
		color: "#737373",
	},
	syncButton: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: "#FFF7ED",
	},
	syncButtonPressed: {
		backgroundColor: "#FFEDD5",
	},
	syncButtonText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#EA580C",
	},
	calendarLoading: {
		paddingVertical: 24,
	},
	calendarRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
	},
	calendarRowBorder: {
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F5",
	},
	calendarInfo: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		marginRight: 12,
	},
	calendarDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: 10,
	},
	calendarTextWrap: {
		flex: 1,
	},
	calendarName: {
		fontSize: 15,
		fontWeight: "500",
		color: "#171717",
	},
	calendarEmail: {
		fontSize: 12,
		color: "#A3A3A3",
		marginTop: 2,
	},
	noCalendars: {
		fontSize: 14,
		color: "#A3A3A3",
		textAlign: "center",
		paddingVertical: 8,
	},
	logoutButton: {
		backgroundColor: "#EF4444",
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
	},
	logoutButtonPressed: {
		backgroundColor: "#DC2626",
	},
	logoutButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
