import { apiFetch } from "./client";

// ============================================================
// 型定義
// ============================================================

/** 送信キーの設定値 */
export type SendKeyType = "enter" | "cmd+enter";

/** AI設定レスポンス */
export interface AISettingsResponse {
	/** LLMプロバイダ */
	provider: string | null;
	/** APIキーが設定済みかどうか */
	hasApiKey: boolean;
	/** 使用するモデル名 */
	model?: string;
	/** OllamaのベースURL */
	baseUrl?: string;
}

/** AI設定更新リクエスト */
export interface UpdateAISettingsRequest {
	/** LLMプロバイダ識別子 */
	provider: string;
	/** APIキー（Claude/OpenAI用） */
	apiKey?: string;
	/** OllamaのベースURL */
	baseUrl?: string;
	/** 使用するモデル名 */
	model?: string;
}

/** チャット設定レスポンス */
export interface ChatSettingsResponse {
	/** 送信キー設定 */
	sendKey: SendKeyType;
}

/** チャット設定更新リクエスト */
export interface UpdateChatSettingsRequest {
	/** 送信キー設定 */
	sendKey: SendKeyType;
}

/** 設定保存レスポンス */
interface SettingsSaveResponse {
	success: boolean;
	error?: {
		code: string;
		message: string;
	};
}

// ============================================================
// AI設定 API
// ============================================================

/**
 * AI設定を取得
 */
export function fetchAISettings(): Promise<AISettingsResponse> {
	return apiFetch<AISettingsResponse>("/api/settings/ai");
}

/**
 * AI設定を更新
 */
export function updateAISettings(
	data: UpdateAISettingsRequest,
): Promise<SettingsSaveResponse> {
	return apiFetch<SettingsSaveResponse>("/api/settings/ai", {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

// ============================================================
// チャット設定 API
// ============================================================

/**
 * チャット送信キー設定を取得
 */
export function fetchChatSettings(): Promise<ChatSettingsResponse> {
	return apiFetch<ChatSettingsResponse>("/api/settings/chat");
}

/**
 * チャット送信キー設定を更新
 */
export function updateChatSettings(
	data: UpdateChatSettingsRequest,
): Promise<SettingsSaveResponse> {
	return apiFetch<SettingsSaveResponse>("/api/settings/chat", {
		method: "PUT",
		body: JSON.stringify(data),
	});
}
