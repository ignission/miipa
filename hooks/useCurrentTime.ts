"use client";

/**
 * 現在時刻フック
 *
 * 現在時刻をリアルタイムで提供し、60秒間隔で更新します。
 * 分の境界に同期することで、時計表示などに最適化されています。
 *
 * @module hooks/useCurrentTime
 *
 * @example
 * ```tsx
 * const currentTime = useCurrentTime();
 *
 * return (
 *   <div>
 *     現在時刻: {currentTime.toLocaleTimeString()}
 *   </div>
 * );
 * ```
 */

import { useEffect, useState } from "react";

/**
 * 現在時刻をリアルタイムで提供するフック
 *
 * 60秒間隔で更新し、分の境界に同期します。
 * 例: 10:30:45の場合、次の更新は10:31:00に行われます。
 *
 * @returns 現在時刻のDateオブジェクト
 *
 * @example
 * ```tsx
 * function Clock() {
 *   const currentTime = useCurrentTime();
 *
 *   return (
 *     <time dateTime={currentTime.toISOString()}>
 *       {currentTime.toLocaleTimeString('ja-JP', {
 *         hour: '2-digit',
 *         minute: '2-digit'
 *       })}
 *     </time>
 *   );
 * }
 * ```
 */
export function useCurrentTime(): Date {
	const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

	useEffect(() => {
		// インターバルIDを保持する変数
		let intervalId: ReturnType<typeof setInterval> | null = null;

		// 次の分までの残りミリ秒を計算
		const now = new Date();
		const msUntilNextMinute =
			(60 - now.getSeconds()) * 1000 - now.getMilliseconds();

		// 最初のタイムアウトで分境界に同期
		const timeoutId = setTimeout(() => {
			setCurrentTime(new Date());

			// その後は60秒間隔で更新
			intervalId = setInterval(() => {
				setCurrentTime(new Date());
			}, 60000);
		}, msUntilNextMinute);

		// クリーンアップ: タイムアウトとインターバルの両方をクリア
		return () => {
			clearTimeout(timeoutId);
			if (intervalId !== null) {
				clearInterval(intervalId);
			}
		};
	}, []);

	return currentTime;
}
