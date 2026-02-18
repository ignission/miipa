/**
 * カレンダーセットアップコンポーネント
 *
 * セットアップフロー内でカレンダーを連携するためのUIコンポーネントです。
 * Googleカレンダーの追加と、連携済みカレンダーの表示を行います。
 *
 * @module components/setup/calendar-setup
 */

import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

// ============================================================
// 型定義
// ============================================================

/**
 * CalendarSetupコンポーネントのProps
 */
interface CalendarSetupProps {
	/** カレンダー設定完了時のコールバック */
	onComplete: () => void;
	/** Googleカレンダー認証を開始する関数 */
	startAuth: () => Promise<void>;
	/** 認証中フラグ */
	isAuthLoading: boolean;
	/** 認証エラー */
	authError: string | null;
	/** 連携済みカレンダー一覧 */
	calendars: Array<{
		id: string | number;
		name: string;
		type: "google" | "ical";
	}>;
	/** カレンダー読み込み中フラグ */
	isLoading: boolean;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * チェックアイコン
 */
function CheckIcon() {
	return (
		<Svg width={20} height={20} viewBox="0 0 20 20" fill="currentColor">
			<Path
				fillRule="evenodd"
				d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
				clipRule="evenodd"
			/>
		</Svg>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * カレンダーセットアップ
 *
 * セットアップウィザード内でカレンダーを連携するUIを提供します。
 * - Googleカレンダー連携ボタン
 * - 連携済みカレンダーの表示
 * - 次のステップへ進むボタン
 */
export function CalendarSetup({
	onComplete,
	startAuth,
	isAuthLoading,
	authError,
	calendars,
	isLoading,
}: CalendarSetupProps) {
	const [notification, setNotification] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	/**
	 * 通知を自動的に消す
	 */
	useEffect(() => {
		if (notification) {
			const timer = setTimeout(() => {
				setNotification(null);
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [notification]);

	/**
	 * Googleカレンダー連携を開始
	 */
	const handleAddGoogle = useCallback(async () => {
		await startAuth();
	}, [startAuth]);

	const hasCalendars = calendars.length > 0;

	return (
		<View className="gap-6">
			{/* 説明文 */}
			<View className="items-center">
				<Text className="text-center text-sm text-fg-muted">
					Googleカレンダーを連携して、予定を確認できるようにしましょう
				</Text>
			</View>

			{/* 通知メッセージ */}
			{notification && (
				<View
					className={`rounded-md p-3 ${
						notification.type === "success" ? "bg-green-100" : "bg-red-100"
					}`}
					accessibilityRole="alert"
				>
					<Text
						className={`text-sm ${
							notification.type === "success"
								? "text-green-800"
								: "text-red-800"
						}`}
					>
						{notification.message}
					</Text>
				</View>
			)}

			{/* Googleカレンダー連携ボタン */}
			<Pressable
				onPress={handleAddGoogle}
				disabled={isAuthLoading}
				className={`w-full flex-row items-center justify-center gap-3 rounded-lg border border-border bg-bg p-4 ${
					isAuthLoading ? "opacity-60" : ""
				}`}
			>
				<Text className="text-base font-medium text-fg">
					{isAuthLoading ? "認証中..." : "Googleカレンダーを連携"}
				</Text>
			</Pressable>

			{/* 認証エラーメッセージ */}
			{authError && (
				<View className="rounded-md bg-red-100 p-3" accessibilityRole="alert">
					<Text className="text-sm text-red-800">{authError}</Text>
				</View>
			)}

			{/* ローディング状態 */}
			{isLoading && (
				<View className="items-center justify-center py-4">
					<Text className="text-sm text-fg-muted">読み込み中...</Text>
				</View>
			)}

			{/* 連携済みカレンダー一覧 */}
			{!isLoading && hasCalendars && (
				<View className="gap-3">
					<Text className="text-sm font-medium text-fg-muted">
						連携済みカレンダー
					</Text>
					<View className="gap-2">
						{calendars.map((calendar) => (
							<View
								key={String(calendar.id)}
								className="flex-row items-center gap-3 rounded-md border border-border bg-bg-subtle p-3"
							>
								<View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
									<View className="text-green-600">
										<CheckIcon />
									</View>
								</View>
								<View className="min-w-0 flex-1">
									<Text
										className="text-sm font-medium text-fg"
										numberOfLines={1}
									>
										{calendar.name}
									</Text>
									<Text className="text-xs text-fg-muted">
										{calendar.type === "google" ? "Googleカレンダー" : "iCal"}
									</Text>
								</View>
							</View>
						))}
					</View>
				</View>
			)}

			{/* 次へボタン */}
			<View className="items-center pt-4">
				<Pressable
					onPress={onComplete}
					disabled={!hasCalendars}
					className={`flex-row items-center justify-center gap-2 rounded-lg px-8 py-3 ${
						hasCalendars ? "bg-accent" : "bg-bg-muted"
					}`}
				>
					<Text
						className={`font-medium ${
							hasCalendars ? "text-white" : "text-fg-muted"
						}`}
					>
						{hasCalendars ? "次へ進む" : "カレンダーを連携してください"}
					</Text>
				</Pressable>
			</View>

			{/* スキップリンク */}
			{!hasCalendars && (
				<View className="items-center">
					<Pressable onPress={onComplete}>
						<Text className="text-sm text-fg-muted underline">
							後で設定する
						</Text>
					</Pressable>
				</View>
			)}
		</View>
	);
}
