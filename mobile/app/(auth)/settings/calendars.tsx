/**
 * カレンダー設定画面
 *
 * Web版 app/settings/calendars/page.tsx に対応する Expo Router 画面です。
 * カレンダーの一覧表示、追加（Google / iCal）、削除、同期機能を提供します。
 *
 * @module app/(auth)/settings/calendars
 */

import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SyncStatusBadge } from "../../../src/components/calendar/sync-status-badge";
import { AddGoogleCalendarButton } from "../../../src/components/settings/add-google-calendar-button";
import { AddICalDialog } from "../../../src/components/settings/add-ical-dialog";
import { CalendarList } from "../../../src/components/settings/calendar-list";
import { DeleteCalendarDialog } from "../../../src/components/settings/delete-calendar-dialog";
import {
	useCalendars,
	useSyncCalendars,
} from "../../../src/hooks/useCalendars";

// ============================================================
// 型定義
// ============================================================

/** 削除対象のカレンダー情報 */
interface DeleteTarget {
	id: string;
	name: string;
	type: "google" | "ical";
}

export default function CalendarsSettingsScreen() {
	const {
		calendars,
		isLoading: isLoadingCalendars,
		toggleCalendar,
		deleteCalendar: deleteCalendarMutation,
		startGoogleAuth,
		addICalCalendar,
	} = useCalendars();
	const syncMutation = useSyncCalendars();

	// iCalダイアログの状態
	const [isICalDialogOpen, setIsICalDialogOpen] = useState(false);
	const [isAddingICal, setIsAddingICal] = useState(false);
	const [iCalError, setICalError] = useState<string | null>(null);

	// 削除ダイアログの状態
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Google認証の状態
	const [isGoogleAuthLoading, setIsGoogleAuthLoading] = useState(false);

	/**
	 * カレンダーの有効/無効を切り替え
	 */
	const handleToggle = useCallback(
		(id: string, enabled: boolean) => {
			toggleCalendar({ id, enabled });
		},
		[toggleCalendar],
	);

	/**
	 * カレンダー削除ダイアログを開く
	 */
	const handleDelete = useCallback(
		(id: string) => {
			const cal = calendars?.find((c) => c.id === id);
			if (cal) {
				setDeleteTarget({
					id: String(cal.id),
					name: cal.name,
					type: (cal as { type?: "google" | "ical" }).type ?? "google",
				});
				setIsDeleteDialogOpen(true);
			}
		},
		[calendars],
	);

	/**
	 * カレンダー削除の確認処理
	 */
	const handleDeleteConfirm = useCallback(async () => {
		if (!deleteTarget) return;
		await deleteCalendarMutation(deleteTarget.id);
		setIsDeleteDialogOpen(false);
		setDeleteTarget(null);
	}, [deleteTarget, deleteCalendarMutation]);

	/**
	 * Google認証フローを開始
	 */
	const handleStartGoogleAuth = useCallback(async () => {
		setIsGoogleAuthLoading(true);
		try {
			const result = await startGoogleAuth();
			if (result.authUrl) {
				await WebBrowser.openBrowserAsync(result.authUrl);
			}
		} finally {
			setIsGoogleAuthLoading(false);
		}
	}, [startGoogleAuth]);

	/**
	 * iCalカレンダーを追加
	 */
	const handleAddICal = useCallback(
		async (url: string, name?: string): Promise<boolean> => {
			setIsAddingICal(true);
			setICalError(null);
			try {
				await addICalCalendar({ url, name });
				return true;
			} catch (e) {
				setICalError(e instanceof Error ? e.message : "追加に失敗しました");
				return false;
			} finally {
				setIsAddingICal(false);
			}
		},
		[addICalCalendar],
	);

	/**
	 * カレンダー一覧をCalendarList用の型に変換
	 */
	const calendarConfigs = (calendars ?? []).map((cal) => ({
		id: String(cal.id),
		name: cal.name,
		type: ((cal as { type?: string }).type ?? "google") as "google" | "ical",
		enabled: cal.enabled,
		googleAccountEmail: cal.accountEmail,
	}));

	return (
		<>
			<Stack.Screen options={{ title: "カレンダー設定" }} />
			<ScrollView className="flex-1 bg-bg-canvas">
				<View className="mx-auto w-full max-w-2xl p-4">
					{/* 同期ステータス */}
					<View className="mb-4 flex-row items-center justify-between">
						<SyncStatusBadge
							lastSyncTime={syncMutation.isSuccess ? new Date() : undefined}
							hasError={syncMutation.isError}
						/>
					</View>

					{/* カレンダー一覧 */}
					{isLoadingCalendars ? (
						<View className="items-center py-8">
							<ActivityIndicator size="large" color="#F97316" />
							<Text className="mt-2 text-sm text-fg-muted">読み込み中...</Text>
						</View>
					) : (
						<CalendarList
							calendars={calendarConfigs}
							onToggle={handleToggle}
							onDelete={handleDelete}
							onSync={() => syncMutation.mutate()}
							isSyncing={syncMutation.isPending}
						/>
					)}

					{/* カレンダー追加ボタン群 */}
					<View className="mt-6 gap-3">
						<Text className="text-sm font-medium text-fg-muted">
							カレンダーを追加
						</Text>

						{/* Googleカレンダー追加ボタン */}
						<AddGoogleCalendarButton
							startAuth={handleStartGoogleAuth}
							isLoading={isGoogleAuthLoading}
						/>

						{/* iCalカレンダー追加ボタン */}
						<View>
							<AddGoogleCalendarButton
								startAuth={async () => setIsICalDialogOpen(true)}
								isLoading={false}
								onSuccess={() => {}}
							/>
						</View>
					</View>
				</View>
			</ScrollView>

			{/* iCal追加ダイアログ */}
			<AddICalDialog
				isOpen={isICalDialogOpen}
				onClose={() => setIsICalDialogOpen(false)}
				onAdd={handleAddICal}
				isLoading={isAddingICal}
				error={iCalError}
			/>

			{/* カレンダー削除確認ダイアログ */}
			<DeleteCalendarDialog
				isOpen={isDeleteDialogOpen}
				calendar={deleteTarget}
				onClose={() => {
					setIsDeleteDialogOpen(false);
					setDeleteTarget(null);
				}}
				onConfirm={handleDeleteConfirm}
			/>
		</>
	);
}
