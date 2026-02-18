/**
 * 設定サブ画面のStackナビゲーションレイアウト
 *
 * calendars / ai / account サブ画面を Stack で管理します。
 *
 * @module app/(auth)/settings/_layout
 */

import { Stack } from "expo-router";

export default function SettingsLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerBackTitle: "設定",
			}}
		/>
	);
}
