import { apiFetch } from "./client";

// ============================================================
// 型定義
// ============================================================

/** アカウント削除レスポンス */
interface DeleteAccountResponse {
	success: boolean;
	error?: string;
}

// ============================================================
// API関数
// ============================================================

/**
 * アカウントを削除
 *
 * 関連するすべてのデータ（カレンダー、設定、チャット履歴等）も
 * 合わせて削除されます。
 */
export function deleteAccount(): Promise<DeleteAccountResponse> {
	return apiFetch<DeleteAccountResponse>("/api/account", {
		method: "DELETE",
	});
}
