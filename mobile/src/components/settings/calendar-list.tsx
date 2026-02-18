/**
 * CalendarListコンポーネント
 *
 * カレンダー一覧を表示するコンポーネントです。
 * Web版の CalendarList + CalendarCard を統合しています。
 *
 * @module components/settings/calendar-list
 */

import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Switch } from "../ui/switch";

// ============================================================
// 型定義
// ============================================================

/** カレンダーIDの型 */
type CalendarId = string;

/** カレンダー設定の型 */
interface CalendarConfig {
	id: CalendarId;
	name: string;
	type: "google" | "ical";
	enabled: boolean;
	googleAccountEmail?: string;
}

/**
 * CalendarListコンポーネントのProps
 */
interface CalendarListProps {
	/** カレンダー設定の配列 */
	calendars: CalendarConfig[];
	/** 有効/無効トグル時のコールバック */
	onToggle: (id: CalendarId, enabled: boolean) => void;
	/** 削除時のコールバック */
	onDelete: (id: CalendarId) => void;
	/** 同期実行時のコールバック */
	onSync: () => void;
	/** 同期中フラグ */
	isSyncing: boolean;
	/** 最終同期時刻 */
	lastSyncTime?: Date;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * ゴミ箱アイコン
 */
function TrashIcon() {
	return (
		<Svg width={16} height={16} viewBox="0 0 20 20" fill="currentColor">
			<Path
				fillRule="evenodd"
				d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
				clipRule="evenodd"
			/>
		</Svg>
	);
}

/**
 * カレンダータイプアイコン
 */
function CalendarTypeIcon({ type }: { type: "google" | "ical" }) {
	if (type === "google") {
		return (
			<View
				className="h-8 w-8 items-center justify-center rounded-full bg-blue-500"
				accessibilityLabel="Google Calendar"
			>
				<Text className="text-sm font-bold text-white">G</Text>
			</View>
		);
	}

	return (
		<View
			className="h-8 w-8 items-center justify-center"
			accessibilityLabel="iCalカレンダー"
		>
			<Text className="text-lg">📅</Text>
		</View>
	);
}

/**
 * 空状態メッセージ
 */
function EmptyState() {
	return (
		<View className="items-center justify-center rounded-lg border-2 border-dashed border-border bg-bg-subtle px-4 py-12">
			<Text className="mb-4 text-4xl">📅</Text>
			<Text className="mb-2 text-base font-medium text-fg">
				カレンダーがありません
			</Text>
			<Text className="text-sm text-fg-muted">
				カレンダーを追加してください
			</Text>
		</View>
	);
}

/**
 * カレンダーカード
 */
function CalendarCard({
	calendar,
	onToggle,
	onDelete,
}: {
	calendar: CalendarConfig;
	onToggle: (enabled: boolean) => void;
	onDelete: () => void;
}) {
	return (
		<View
			className={`rounded-lg border border-border bg-bg p-4 ${
				calendar.enabled ? "" : "opacity-50"
			}`}
		>
			{/* ヘッダー: アイコン + 名前 + スイッチ + 削除 */}
			<View className="mb-2 flex-row items-center gap-3">
				{/* タイプアイコン */}
				<CalendarTypeIcon type={calendar.type} />

				{/* カレンダー情報 */}
				<View className="min-w-0 flex-1">
					<Text className="text-base font-semibold text-fg" numberOfLines={1}>
						{calendar.name}
					</Text>
					{calendar.type === "google" && calendar.googleAccountEmail && (
						<Text className="text-xs text-fg-muted" numberOfLines={1}>
							{calendar.googleAccountEmail}
						</Text>
					)}
				</View>

				{/* スイッチ */}
				<Switch value={calendar.enabled} onValueChange={onToggle} />

				{/* 削除ボタン */}
				<Pressable
					onPress={onDelete}
					accessibilityLabel={`${calendar.name}を削除`}
					accessibilityRole="button"
					className="rounded-md p-2 active:bg-red-100"
				>
					<View className="text-fg-muted">
						<TrashIcon />
					</View>
				</Pressable>
			</View>
		</View>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * カレンダーリスト
 *
 * 登録されているカレンダーを縦並びで表示します。
 * カレンダーがない場合は空状態のメッセージを表示します。
 */
export function CalendarList({
	calendars,
	onToggle,
	onDelete,
	onSync: _onSync,
	isSyncing: _isSyncing,
	lastSyncTime: _lastSyncTime,
}: CalendarListProps) {
	if (calendars.length === 0) {
		return <EmptyState />;
	}

	return (
		<View className="gap-4" accessibilityLabel="カレンダー一覧">
			{calendars.map((calendar) => (
				<CalendarCard
					key={String(calendar.id)}
					calendar={calendar}
					onToggle={(enabled) => onToggle(calendar.id, enabled)}
					onDelete={() => onDelete(calendar.id)}
				/>
			))}
		</View>
	);
}
