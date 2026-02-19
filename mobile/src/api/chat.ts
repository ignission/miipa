import { AUTH_CONFIG } from "../auth/config";
import { getToken } from "../auth/storage";
import { apiFetch } from "./client";

// ============================================================
// 型定義
// ============================================================

/** チャットメッセージ */
export interface ChatMessage {
	/** メッセージID */
	id: string;
	/** メッセージの送信者ロール */
	role: "user" | "assistant";
	/** メッセージ本文 */
	content: string;
	/** 作成日時（ISO 8601形式） */
	createdAt: string;
}

/** SSEストリームイベント */
export interface StreamEvent {
	/** イベント種別 */
	type: "text" | "tool_call" | "done" | "error";
	/** テキストデータ（text時のみ） */
	text?: string;
	/** エラーメッセージ（error時のみ） */
	error?: string;
	/** ツール呼び出し情報（tool_call時のみ） */
	toolCall?: {
		id: string;
		name: string;
		arguments: Record<string, unknown>;
	};
}

/** チャット履歴レスポンス */
interface ChatHistoryResponse {
	messages: ChatMessage[];
}

/** チャット送信リクエスト */
interface ChatRequest {
	messages: ReadonlyArray<{
		role: "user" | "assistant";
		content: string;
	}>;
}

// ============================================================
// API関数
// ============================================================

/**
 * チャット履歴を取得
 */
export function fetchChatHistory(): Promise<ChatHistoryResponse | null> {
	return apiFetch<ChatHistoryResponse>("/chat");
}

/**
 * チャットメッセージを送信（SSEストリーミング）
 *
 * apiFetch はレスポンス全体をJSONパースするため、
 * SSEストリーミングには対応できません。
 * 直接 fetch + ReadableStream を使用します。
 *
 * @param messages - 送信するメッセージ配列
 * @returns ReadableStream を含む Response
 */
export async function sendChatMessage(
	messages: ChatRequest["messages"],
): Promise<Response> {
	const token = await getToken();

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/chat`, {
		method: "POST",
		headers,
		credentials: "include",
		body: JSON.stringify({ messages }),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(errorText || "メッセージの送信に失敗しました");
	}

	return response;
}

/**
 * SSEデータ行を解析する
 *
 * @param line - SSEデータ行（"data: ..." 形式）
 * @returns 解析された StreamEvent、または解析不能の場合は null
 */
export function parseSSELine(line: string): StreamEvent | null {
	const trimmed = line.trim();
	if (!trimmed.startsWith("data: ")) {
		return null;
	}

	const jsonStr = trimmed.slice(6);
	if (!jsonStr || jsonStr === "[DONE]") {
		return { type: "done" };
	}

	try {
		return JSON.parse(jsonStr) as StreamEvent;
	} catch {
		return null;
	}
}
