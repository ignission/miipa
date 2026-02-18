import { useEffect, useState } from "react";

/**
 * 現在時刻をリアルタイムで提供するフック
 *
 * 60秒間隔で更新し、分の境界に同期します。
 * 例: 10:30:45の場合、次の更新は10:31:00に行われます。
 *
 * Web の useCurrentTime からの移植です。
 * React Native 環境でも同じ動作をします。
 *
 * @returns 現在時刻のDateオブジェクト
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
