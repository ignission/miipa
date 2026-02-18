/**
 * 設定画面
 *
 * アカウント情報、カレンダー一覧、設定サブ画面へのナビゲーションを提供します。
 * Web用の設定ナビゲーション（カレンダー設定、AI設定、アカウント設定へのリンク）を含みます。
 *
 * @module app/(auth)/settings
 */

import { Link } from "expo-router";
import {
	ActivityIndicator,
	Platform,
	Pressable,
	ScrollView,
	Switch,
	Text,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../src/auth";
import { useCalendars, useSyncCalendars } from "../../src/hooks/useCalendars";

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 右矢印アイコン（ナビゲーション用）
 */
function ChevronRightIcon() {
	return (
		<Svg width={20} height={20} viewBox="0 0 20 20" fill="#A3A3A3">
			<Path
				fillRule="evenodd"
				d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
				clipRule="evenodd"
			/>
		</Svg>
	);
}

/**
 * 設定メニュー項目
 */
function SettingsMenuItem({
	href,
	title,
	subtitle,
}: {
	href: string;
	title: string;
	subtitle: string;
}) {
	return (
		<Link href={href as never} asChild>
			<Pressable className="flex-row items-center justify-between rounded-xl border border-neutral-100 bg-white p-4 shadow-sm active:bg-neutral-50">
				<View className="min-w-0 flex-1">
					<Text className="text-base font-semibold text-neutral-900">
						{title}
					</Text>
					<Text className="mt-0.5 text-sm text-neutral-500">
						{subtitle}
					</Text>
				</View>
				<ChevronRightIcon />
			</Pressable>
		</Link>
	);
}

// ============================================================
// メイン
// ============================================================

export default function SettingsScreen() {
	const { user, signOut } = useAuth();
	const { calendars, isLoading: isLoadingCalendars } = useCalendars();
	const syncMutation = useSyncCalendars();

	return (
		<ScrollView className="flex-1 bg-neutral-50">
			{/* Web用のコンテナ制約 */}
			<View
				className={`mx-auto w-full ${
					Platform.OS === "web" ? "max-w-2xl px-6 py-4" : ""
				}`}
			>
				{/* アカウント情報 */}
				<View className="mt-6 px-4">
					<Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
						アカウント
					</Text>
					{user && (
						<View className="rounded-xl bg-white p-4 shadow-sm">
							<Text className="text-lg font-semibold text-neutral-900">
								{user.name ?? "ユーザー"}
							</Text>
							<Text className="text-sm text-neutral-500">
								{user.email}
							</Text>
						</View>
					)}
				</View>

				{/* 設定メニュー（サブ画面ナビゲーション） */}
				<View className="mt-6 gap-3 px-4">
					<Text className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
						設定
					</Text>

					<SettingsMenuItem
						href="/(auth)/settings/calendars"
						title="カレンダー設定"
						subtitle="カレンダーの追加・削除・同期"
					/>

					<SettingsMenuItem
						href="/(auth)/settings/ai"
						title="AI設定"
						subtitle="AIプロバイダ・モデルの変更"
					/>

					<SettingsMenuItem
						href="/(auth)/settings/account"
						title="アカウント"
						subtitle="ログアウト・アカウント削除"
					/>
				</View>

				{/* カレンダー一覧（クイックビュー） */}
				<View className="mt-6 px-4">
					<View className="mb-2 flex-row items-center justify-between">
						<Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
							カレンダー
						</Text>
						<Pressable
							className="rounded-lg bg-orange-50 px-3 py-1.5 active:bg-orange-100"
							onPress={() => syncMutation.mutate()}
							disabled={syncMutation.isPending}
						>
							{syncMutation.isPending ? (
								<ActivityIndicator
									size="small"
									color="#F97316"
								/>
							) : (
								<Text className="text-xs font-semibold text-orange-600">
									同期
								</Text>
							)}
						</Pressable>
					</View>

					{isLoadingCalendars ? (
						<ActivityIndicator
							size="small"
							color="#F97316"
							style={{ paddingVertical: 24 }}
						/>
					) : calendars && calendars.length > 0 ? (
						<View className="rounded-xl bg-white p-4 shadow-sm">
							{calendars.map((calendar, index) => (
								<View
									key={calendar.id}
									className={`flex-row items-center justify-between py-2.5 ${
										index < calendars.length - 1
											? "border-b border-neutral-100"
											: ""
									}`}
								>
									<View className="mr-3 flex-1 flex-row items-center">
										<View
											className="mr-2.5 h-2.5 w-2.5 rounded-full"
											style={{
												backgroundColor:
													calendar.color ?? "#F97316",
											}}
										/>
										<View className="min-w-0 flex-1">
											<Text
												className="text-sm font-medium text-neutral-900"
												numberOfLines={1}
											>
												{calendar.name}
											</Text>
											{calendar.accountEmail && (
												<Text
													className="mt-0.5 text-xs text-neutral-400"
													numberOfLines={1}
												>
													{calendar.accountEmail}
												</Text>
											)}
										</View>
									</View>
									<Switch
										value={calendar.enabled}
										disabled
										trackColor={{
											false: "#D4D4D4",
											true: "#FDBA74",
										}}
										thumbColor={
											calendar.enabled
												? "#F97316"
												: "#f4f3f4"
										}
									/>
								</View>
							))}
						</View>
					) : (
						<View className="rounded-xl bg-white p-4 shadow-sm">
							<Text className="py-2 text-center text-sm text-neutral-400">
								カレンダーが見つかりません
							</Text>
						</View>
					)}
				</View>

				{/* ログアウト */}
				<View className="mt-6 px-4">
					<Pressable
						className="items-center rounded-xl bg-red-500 px-6 py-3.5 active:bg-red-600"
						onPress={signOut}
					>
						<Text className="text-base font-semibold text-white">
							ログアウト
						</Text>
					</Pressable>
				</View>

				{/* 下部余白 */}
				<View className="h-8" />
			</View>
		</ScrollView>
	);
}
