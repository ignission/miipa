"use client";

/**
 * 送信キー設定フック
 *
 * チャットのメッセージ送信キー（Enter / Cmd+Enter）を
 * 管理するためのカスタムフックです。
 * 楽観的更新により即座にUIへ反映し、API保存に失敗した場合はロールバックします。
 *
 * @module hooks/useSendKeySetting
 *
 * @example
 * ```tsx
 * const { sendKey, toggleSendKey, isLoading } = useSendKeySetting();
 * ```
 */

import { useCallback, useEffect, useState } from "react";

// ============================================================
// 型定義
// ============================================================

/** 送信キーの設定値 */
export type SendKeyType = "enter" | "cmd+enter";

/** 送信キー設定APIレスポンスの型 */
interface SendKeySettingResponse {
	/** 送信キー設定 */
	sendKey: SendKeyType;
}

/**
 * useSendKeySettingフックの戻り値型
 */
export interface UseSendKeySettingReturn {
	/** 現在の送信キー設定 */
	sendKey: SendKeyType;
	/** 送信キーをトグルする関数（楽観的更新付き） */
	toggleSendKey: () => void;
	/** ローディング状態（初回取得中） */
	isLoading: boolean;
}

// ============================================================
// 定数
// ============================================================

/** 送信キー設定のデフォルト値 */
const DEFAULT_SEND_KEY: SendKeyType = "enter";

/** 送信キー設定APIのエンドポイント */
const API_ENDPOINT = "/api/settings/chat";

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * 送信キーの値をトグルする
 *
 * @param current - 現在の送信キー設定
 * @returns トグル後の送信キー設定
 */
function toggleValue(current: SendKeyType): SendKeyType {
	return current === "enter" ? "cmd+enter" : "enter";
}

// ============================================================
// メインフック
// ============================================================

/**
 * 送信キー設定フック
 *
 * チャットのメッセージ送信キー設定を管理します。
 * 初回マウント時にAPIから設定を取得し、トグル操作では楽観的更新を行います。
 *
 * @returns 送信キー設定の状態と操作関数
 */
export function useSendKeySetting(): UseSendKeySettingReturn {
	const [sendKey, setSendKey] = useState<SendKeyType>(DEFAULT_SEND_KEY);
	const [isLoading, setIsLoading] = useState(true);

	/**
	 * 初回マウント時にAPIから送信キー設定を取得する
	 */
	useEffect(() => {
		async function loadSetting() {
			try {
				const response = await fetch(API_ENDPOINT);
				if (response.ok) {
					const data: SendKeySettingResponse = await response.json();
					if (data.sendKey) {
						setSendKey(data.sendKey);
					}
				}
			} catch {
				// 取得失敗時はデフォルト値を維持
			} finally {
				setIsLoading(false);
			}
		}

		loadSetting();
	}, []);

	/**
	 * 送信キー設定をトグルする（楽観的更新）
	 *
	 * 1. 現在値を保存
	 * 2. 即座にUIに反映（stateを更新）
	 * 3. PUT APIを呼び出し
	 * 4. 失敗したら元の値にロールバック
	 */
	const toggleSendKey = useCallback(() => {
		const previousValue = sendKey;
		const nextValue = toggleValue(previousValue);

		// 楽観的更新: 即座にUIへ反映
		setSendKey(nextValue);

		// APIへ保存（失敗時はロールバック）
		fetch(API_ENDPOINT, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sendKey: nextValue }),
		})
			.then((response) => {
				if (!response.ok) {
					// 保存失敗: ロールバック
					setSendKey(previousValue);
				}
			})
			.catch(() => {
				// ネットワークエラー: ロールバック
				setSendKey(previousValue);
			});
	}, [sendKey]);

	return {
		sendKey,
		toggleSendKey,
		isLoading,
	};
}
