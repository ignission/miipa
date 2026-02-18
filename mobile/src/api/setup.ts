import { apiFetch } from "./client";

// ============================================================
// 型定義
// ============================================================

/** セットアップ状態レスポンス */
export interface SetupStatusResponse {
	/** セットアップが完了しているかどうか */
	isComplete: boolean;
	/** 現在設定されているプロバイダ */
	currentProvider?: string;
	/** APIキーが設定済みかどうか */
	hasApiKey: boolean;
	/** 登録済みカレンダー数 */
	calendarCount: number;
}

/** 設定保存リクエスト */
export interface SaveSetupSettingsRequest {
	/** LLMプロバイダ */
	provider: string;
	/** APIキー（Claude/OpenAI用） */
	apiKey?: string;
	/** OllamaのベースURL */
	baseUrl?: string;
	/** 使用するモデル名 */
	model?: string;
	/** 既存のAPIキーを上書きするか */
	overwriteExisting?: boolean;
}

/** 設定保存レスポンス */
export interface SaveSetupSettingsResponse {
	success: boolean;
	/** 既存キーが存在し上書き確認が必要 */
	requiresConfirmation?: boolean;
	error?: {
		code: string;
		message: string;
	};
}

/** APIキー検証リクエスト */
export interface ValidateKeyRequest {
	/** LLMプロバイダ */
	provider: "claude" | "openai" | "ollama" | "gemini";
	/** APIキー（Ollamaの場合はbaseUrl） */
	apiKey: string;
}

/** APIキー検証レスポンス */
export interface ValidateKeyResponse {
	valid: boolean;
	/** Ollama の場合に利用可能なモデル一覧が返る */
	models?: string[];
	error?: {
		code: string;
		message: string;
	};
}

// ============================================================
// API関数
// ============================================================

/**
 * セットアップ状態を取得
 */
export function fetchSetupStatus(): Promise<SetupStatusResponse> {
	return apiFetch<SetupStatusResponse>("/api/setup/status");
}

/**
 * セットアップ設定を保存
 */
export function saveSetupSettings(
	data: SaveSetupSettingsRequest,
): Promise<SaveSetupSettingsResponse> {
	return apiFetch<SaveSetupSettingsResponse>("/api/setup/settings", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

/**
 * APIキーを検証
 */
export function validateApiKey(
	data: ValidateKeyRequest,
): Promise<ValidateKeyResponse> {
	return apiFetch<ValidateKeyResponse>("/api/setup/validate-key", {
		method: "POST",
		body: JSON.stringify(data),
	});
}
