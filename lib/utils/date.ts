/**
 * 日付・時刻ユーティリティモジュール
 *
 * このモジュールはカレンダー表示に必要な日付・時刻フォーマット機能を提供します。
 * - formatTime: ISO時間文字列をJST "HH:mm" 形式に変換
 * - formatDate: 日付を "M月D日（曜日）" 形式に変換
 * - isToday: 指定日が今日かどうかを判定
 *
 * すべての関数はJSTタイムゾーン（Asia/Tokyo）固定で動作します。
 * 外部ライブラリに依存せず、純粋関数として実装されています。
 *
 * @module lib/utils/date
 */

// ============================================================
// 定数
// ============================================================

/**
 * JSTタイムゾーン識別子
 */
const JST_TIMEZONE = "Asia/Tokyo";

/**
 * 日本語曜日の配列（日曜始まり）
 */
const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"] as const;

// ============================================================
// formatTime - ISO時間文字列をJST "HH:mm" 形式に変換
// ============================================================

/**
 * ISO 8601形式の時間文字列をJST "HH:mm" 形式に変換します
 *
 * UTC時間からJSTに変換し、時:分の形式で返します。
 * 時と分は常に2桁（ゼロパディング）で表示されます。
 *
 * @param isoString - ISO 8601形式の日時文字列（例: "2026-01-26T00:30:00.000Z"）
 * @returns JSTでの "HH:mm" 形式の文字列（例: "09:30"）
 *
 * @throws {Error} 無効な日時文字列が渡された場合
 *
 * @example
 * ```typescript
 * // UTC 00:30 → JST 09:30
 * formatTime("2026-01-26T00:30:00.000Z"); // "09:30"
 *
 * // UTC 15:00 → JST 00:00 (翌日)
 * formatTime("2026-01-26T15:00:00.000Z"); // "00:00"
 *
 * // 深夜
 * formatTime("2026-01-25T23:30:00.000Z"); // "08:30"
 * ```
 */
export function formatTime(isoString: string): string {
	const date = new Date(isoString);

	if (Number.isNaN(date.getTime())) {
		throw new Error(`無効な日時文字列です: ${isoString}`);
	}

	// Intl.DateTimeFormatを使用してJSTに変換
	const formatter = new Intl.DateTimeFormat("ja-JP", {
		timeZone: JST_TIMEZONE,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	return formatter.format(date);
}

// ============================================================
// formatDate - 日付を "M月D日（曜日）" 形式に変換
// ============================================================

/**
 * Dateオブジェクトを "M月D日（曜日）" 形式の文字列に変換します
 *
 * 日本語のカレンダー表示に適した形式で日付を返します。
 * 月・日は先頭のゼロを含まない形式（1月, 1日など）です。
 *
 * @param date - 変換対象のDateオブジェクト
 * @returns "M月D日（曜日）" 形式の文字列（例: "1月26日（月）"）
 *
 * @throws {Error} 無効なDateオブジェクトが渡された場合
 *
 * @example
 * ```typescript
 * // 月曜日
 * formatDate(new Date("2026-01-26")); // "1月26日（月）"
 *
 * // 日曜日
 * formatDate(new Date("2026-02-01")); // "2月1日（日）"
 *
 * // 年末
 * formatDate(new Date("2026-12-31")); // "12月31日（木）"
 * ```
 */
export function formatDate(date: Date): string {
	if (Number.isNaN(date.getTime())) {
		throw new Error("無効なDateオブジェクトです");
	}

	// formatToPartsを使用してJSTの月・日を数値として取得
	const formatter = new Intl.DateTimeFormat("ja-JP", {
		timeZone: JST_TIMEZONE,
		year: "numeric",
		month: "numeric",
		day: "numeric",
	});

	const parts = formatter.formatToParts(date);
	const month = parts.find((p) => p.type === "month")?.value ?? "1";
	const day = parts.find((p) => p.type === "day")?.value ?? "1";

	// 曜日は別途取得
	const weekday = getWeekdayName(date);

	return `${month}月${day}日（${weekday}）`;
}

// ============================================================
// isToday - 指定日が今日かどうかを判定
// ============================================================

/**
 * 指定された日付がJSTで今日かどうかを判定します
 *
 * JSTタイムゾーンでの日付比較を行います。
 * 年・月・日が一致する場合にtrueを返します。
 *
 * @param date - 判定対象のDateオブジェクト
 * @returns JSTで今日の場合true、それ以外はfalse
 *
 * @throws {Error} 無効なDateオブジェクトが渡された場合
 *
 * @example
 * ```typescript
 * // 今日の日付
 * isToday(new Date()); // true
 *
 * // 昨日の日付
 * const yesterday = new Date();
 * yesterday.setDate(yesterday.getDate() - 1);
 * isToday(yesterday); // false
 *
 * // 明日の日付
 * const tomorrow = new Date();
 * tomorrow.setDate(tomorrow.getDate() + 1);
 * isToday(tomorrow); // false
 * ```
 */
export function isToday(date: Date): boolean {
	if (Number.isNaN(date.getTime())) {
		throw new Error("無効なDateオブジェクトです");
	}

	const now = new Date();

	// JSTでの年・月・日を取得するためのフォーマッター
	const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
		timeZone: JST_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const targetDateStr = dateFormatter.format(date);
	const todayStr = dateFormatter.format(now);

	return targetDateStr === todayStr;
}

// ============================================================
// 補助関数（内部使用）
// ============================================================

/**
 * JSTでの曜日インデックスを取得します（内部使用）
 *
 * @param date - 対象のDateオブジェクト
 * @returns 曜日インデックス（0: 日曜, 1: 月曜, ..., 6: 土曜）
 *
 * @internal
 */
function getJstWeekday(date: Date): number {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: JST_TIMEZONE,
		weekday: "short",
	});

	const weekdayStr = formatter.format(date);
	const weekdayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	};

	return weekdayMap[weekdayStr] ?? 0;
}

/**
 * JSTでの曜日名を取得します
 *
 * @param date - 対象のDateオブジェクト
 * @returns 日本語の曜日名（例: "月", "火"）
 *
 * @example
 * ```typescript
 * getWeekdayName(new Date("2026-01-26")); // "月"
 * ```
 */
export function getWeekdayName(date: Date): string {
	if (Number.isNaN(date.getTime())) {
		throw new Error("無効なDateオブジェクトです");
	}

	const index = getJstWeekday(date);
	return WEEKDAY_NAMES[index];
}
