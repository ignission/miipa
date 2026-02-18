/**
 * CurrentTimeIndicatorコンポーネント
 *
 * カレンダービューで現在時刻を示す赤いラインと時刻バッジを表示するコンポーネントです。
 * 1日の表示範囲に対する相対位置を計算し、適切な位置に配置されます。
 * Web版の Panda CSS 実装から NativeWind + React Native に移行しています。
 *
 * @module components/calendar/current-time-indicator
 *
 * @example
 * ```tsx
 * <CurrentTimeIndicator
 *   currentTime={new Date()}
 *   dayStartHour={6}
 *   dayEndHour={22}
 * />
 * ```
 */

import { Text, View } from "react-native";

// ============================================================
// 型定義
// ============================================================

/**
 * CurrentTimeIndicatorコンポーネントのProps
 */
interface CurrentTimeIndicatorProps {
	/** 現在時刻 */
	currentTime: Date;
	/** 1日の開始時刻（デフォルト: 0時） */
	dayStartHour?: number;
	/** 1日の終了時刻（デフォルト: 24時） */
	dayEndHour?: number;
}

// ============================================================
// 定数
// ============================================================

/** デフォルトの1日の開始時刻 */
const DEFAULT_DAY_START_HOUR = 0;

/** デフォルトの1日の終了時刻 */
const DEFAULT_DAY_END_HOUR = 24;

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * 現在時刻をJSTの"HH:mm"形式でフォーマット
 *
 * @param date - フォーマット対象の日時
 * @returns "HH:mm"形式の文字列
 */
function formatTimeJST(date: Date): string {
	return new Intl.DateTimeFormat("ja-JP", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
		timeZone: "Asia/Tokyo",
	}).format(date);
}

/**
 * 1日の時間範囲に対する相対位置（%）を計算
 *
 * @param currentTime - 現在時刻
 * @param dayStartHour - 1日の開始時刻
 * @param dayEndHour - 1日の終了時刻
 * @returns 相対位置（0-100の範囲、範囲外の場合は null）
 */
function calculateTopPosition(
	currentTime: Date,
	dayStartHour: number,
	dayEndHour: number,
): number | null {
	// JSTでの時間・分を取得
	const hours = currentTime.getHours();
	const minutes = currentTime.getMinutes();

	// 1日の時間範囲に対する相対位置（%）
	const totalMinutes = hours * 60 + minutes;
	const dayStartMinutes = dayStartHour * 60;
	const dayEndMinutes = dayEndHour * 60;

	// 表示範囲外の場合は null を返す
	if (totalMinutes < dayStartMinutes || totalMinutes > dayEndMinutes) {
		return null;
	}

	const top =
		((totalMinutes - dayStartMinutes) / (dayEndMinutes - dayStartMinutes)) *
		100;
	return top;
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * 現在時刻インジケーターコンポーネント
 *
 * カレンダービューで現在時刻を示す赤いラインと時刻バッジを表示します。
 * 親要素は position: relative である必要があります。
 *
 * @param props - コンポーネントのProps
 * @param props.currentTime - 現在時刻
 * @param props.dayStartHour - 1日の開始時刻（オプション、デフォルト: 0）
 * @param props.dayEndHour - 1日の終了時刻（オプション、デフォルト: 24）
 * @returns 現在時刻インジケーター要素、または範囲外の場合は null
 */
export function CurrentTimeIndicator({
	currentTime,
	dayStartHour = DEFAULT_DAY_START_HOUR,
	dayEndHour = DEFAULT_DAY_END_HOUR,
}: CurrentTimeIndicatorProps) {
	// 相対位置を計算
	const topPosition = calculateTopPosition(
		currentTime,
		dayStartHour,
		dayEndHour,
	);

	// 表示範囲外の場合は何も表示しない
	if (topPosition === null) {
		return null;
	}

	// 時刻表示文字列
	const timeDisplay = formatTimeJST(currentTime);

	return (
		<View
			className="absolute left-0 right-0 z-10 flex-row items-center"
			style={{ top: `${topPosition}%` }}
			accessibilityLabel={`現在時刻: ${timeDisplay}`}
		>
			{/* 時刻バッジ（左端） */}
			<View className="rounded-md bg-red-500 px-2 py-1">
				<Text className="text-xs font-medium text-white">{timeDisplay}</Text>
			</View>

			{/* 赤いライン */}
			<View className="h-0.5 flex-1 bg-red-500" />
		</View>
	);
}
