import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { fetchChatSettings, updateChatSettings } from "../api/settings";
import type { SendKeyType } from "../api/settings";

// ============================================================
// 型定義（再エクスポート用）
// ============================================================

export type { SendKeyType };

/** useSendKeySettingフックの戻り値型 */
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

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * 送信キーの値をトグルする
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
 * チャットのメッセージ送信キー（Enter / Cmd+Enter）を管理します。
 * Web only の機能のため、Platform.OS === "web" の場合のみ設定を取得・変更します。
 * Mobile では常にデフォルト値（enter）を返します。
 *
 * 楽観的更新により即座にUIへ反映し、API保存に失敗した場合はロールバックします。
 */
export function useSendKeySetting(): UseSendKeySettingReturn {
	const [sendKey, setSendKey] = useState<SendKeyType>(DEFAULT_SEND_KEY);
	const [isLoading, setIsLoading] = useState(Platform.OS === "web");

	/**
	 * 初回マウント時にAPIから送信キー設定を取得（Web のみ）
	 */
	useEffect(() => {
		// Mobile ではキーボードショートカットが不要なため取得しない
		if (Platform.OS !== "web") {
			return;
		}

		async function loadSetting() {
			try {
				const data = await fetchChatSettings();
				if (data.sendKey) {
					setSendKey(data.sendKey);
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
	 * Web のみ有効。Mobile では何も行いません。
	 */
	const toggleSendKey = useCallback(() => {
		// Mobile ではトグル無効
		if (Platform.OS !== "web") {
			return;
		}

		const previousValue = sendKey;
		const nextValue = toggleValue(previousValue);

		// 楽観的更新: 即座にUIへ反映
		setSendKey(nextValue);

		// APIへ保存（失敗時はロールバック）
		updateChatSettings({ sendKey: nextValue })
			.then((result) => {
				if (!result.success) {
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
