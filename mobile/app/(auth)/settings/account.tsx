/**
 * アカウント設定画面
 *
 * Web版 app/settings/account/page.tsx に対応する Expo Router 画面です。
 * ユーザー情報の表示、ログアウト、アカウント削除を提供します。
 *
 * @module app/(auth)/settings/account
 */

import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../../src/auth";
import { DeleteAccountDialog } from "../../../src/components/settings/delete-account-dialog";

export default function AccountSettingsScreen() {
	const { user, signOut } = useAuth();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	return (
		<>
			<Stack.Screen options={{ title: "アカウント" }} />
			<ScrollView className="flex-1 bg-bg-canvas">
				<View className="mx-auto w-full max-w-2xl p-4">
					{/* ユーザー情報セクション */}
					<View className="gap-3">
						<Text className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
							ユーザー情報
						</Text>
						<View className="rounded-xl border border-border bg-bg p-4">
							<Text className="text-lg font-semibold text-fg">
								{user?.name ?? "ユーザー"}
							</Text>
							{user?.email && (
								<Text className="mt-1 text-sm text-fg-muted">{user.email}</Text>
							)}
						</View>
					</View>

					{/* ログアウトセクション */}
					<View className="mt-8 gap-3">
						<Pressable
							onPress={signOut}
							className="items-center rounded-xl border border-border bg-bg p-4 active:bg-bg-subtle"
						>
							<Text className="font-semibold text-fg">ログアウト</Text>
						</Pressable>
					</View>

					{/* アカウント削除セクション */}
					<View className="mt-8 gap-3">
						<Text className="text-sm font-semibold uppercase tracking-wide text-red-500">
							危険な操作
						</Text>
						<Pressable
							onPress={() => setIsDeleteDialogOpen(true)}
							className="items-center rounded-xl bg-red-600 p-4 active:bg-red-700"
						>
							<Text className="font-semibold text-white">アカウントを削除</Text>
						</Pressable>
						<Text className="text-center text-xs text-fg-muted">
							すべてのデータが完全に削除されます。この操作は取り消せません。
						</Text>
					</View>
				</View>
			</ScrollView>

			{/* アカウント削除確認ダイアログ */}
			<DeleteAccountDialog
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				onLogout={signOut}
			/>
		</>
	);
}
