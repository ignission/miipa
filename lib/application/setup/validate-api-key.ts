/**
 * APIキー検証ユースケースモジュール
 *
 * LLMプロバイダ別のAPIキー形式検証と接続テストを提供します。
 * Claude、OpenAI、Ollamaの3つのプロバイダに対応しています。
 *
 * すべての操作はResult型を返し、例外をスローしません。
 * APIキーは一切ログ出力しないセキュアな設計です。
 *
 * @module lib/application/setup/validate-api-key
 *
 * @example
 * ```typescript
 * import { validateApiKey, validateApiKeyFormat } from '@/lib/application/setup/validate-api-key';
 * import { isOk, match } from '@/lib/domain/shared';
 *
 * // 形式チェック
 * const formatResult = validateApiKeyFormat('claude', 'sk-ant-xxxxx');
 * if (isOk(formatResult)) {
 *   console.log('形式は正しいです');
 * }
 *
 * // APIキーの完全検証（接続テスト含む）
 * const validateResult = await validateApiKey('claude', 'sk-ant-xxxxx');
 * match(validateResult, {
 *   ok: () => console.log('APIキーは有効です'),
 *   err: (error) => console.error(`検証失敗: ${error.message}`),
 * });
 * ```
 */

import type { LLMProvider } from "@/lib/config/types";
import { err, isErr, ok, type Result } from "@/lib/domain/shared";

import type { ApiKeyValidationError, OllamaConnectionResult } from "./types";

// 型を再エクスポート（利便性のため）
export type { ApiKeyValidationError, OllamaConnectionResult } from "./types";

// ============================================================
// 定数
// ============================================================

/**
 * APIリクエストのタイムアウト時間（ミリ秒）
 */
const API_TIMEOUT_MS = 3000;

/**
 * Anthropic API エンドポイント
 */
const ANTHROPIC_API_ENDPOINT = "https://api.anthropic.com/v1/messages";

/**
 * OpenAI API エンドポイント
 */
const OPENAI_API_ENDPOINT = "https://api.openai.com/v1/models";

/**
 * デフォルトのOllama ベースURL
 */
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

/**
 * Claude APIキーの形式パターン
 */
const CLAUDE_API_KEY_PATTERN = /^sk-ant-/;

/**
 * OpenAI APIキーの形式パターン
 */
const OPENAI_API_KEY_PATTERN = /^sk-/;

// ============================================================
// APIキー形式検証
// ============================================================

/**
 * APIキーの形式を検証する
 *
 * プロバイダに応じたAPIキー形式のパターンマッチングを行います。
 * Ollamaの場合はAPIキー形式チェックは不要のため、常に成功します。
 *
 * @param provider - LLMプロバイダ識別子
 * @param key - 検証対象のAPIキー
 * @returns 検証結果（成功時はOk(void)、失敗時はErr(ApiKeyValidationError)）
 *
 * @example
 * ```typescript
 * // Claude APIキーの検証
 * const result = validateApiKeyFormat('claude', 'sk-ant-api03-xxxxx');
 * // result: Ok<void>
 *
 * // 不正な形式の検証
 * const invalidResult = validateApiKeyFormat('claude', 'invalid-key');
 * // invalidResult: Err<ApiKeyValidationError> (code: 'INVALID_FORMAT')
 * ```
 */
export function validateApiKeyFormat(
	provider: LLMProvider,
	key: string,
): Result<void, ApiKeyValidationError> {
	switch (provider) {
		case "claude": {
			if (!CLAUDE_API_KEY_PATTERN.test(key)) {
				return err({
					code: "INVALID_FORMAT",
					message:
						"Claude APIキーの形式が正しくありません。「sk-ant-」で始まる必要があります。",
				});
			}
			return ok(undefined);
		}
		case "openai": {
			if (!OPENAI_API_KEY_PATTERN.test(key)) {
				return err({
					code: "INVALID_FORMAT",
					message:
						"OpenAI APIキーの形式が正しくありません。「sk-」で始まる必要があります。",
				});
			}
			return ok(undefined);
		}
		case "ollama": {
			// OllamaはAPIキー不要のため、常に成功
			return ok(undefined);
		}
	}
}

// ============================================================
// 内部ヘルパー関数
// ============================================================

/**
 * タイムアウト付きfetchを実行する
 *
 * @param url - リクエストURL
 * @param options - fetchオプション
 * @param timeoutMs - タイムアウト時間（ミリ秒）
 * @returns Response または ApiKeyValidationError
 */
async function fetchWithTimeout(
	url: string,
	options: RequestInit,
	timeoutMs: number,
): Promise<Result<Response, ApiKeyValidationError>> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		return ok(response);
	} catch (error) {
		clearTimeout(timeoutId);

		// AbortError（タイムアウト）の判定
		if (error instanceof Error && error.name === "AbortError") {
			return err({
				code: "TIMEOUT",
				message:
					"接続がタイムアウトしました。ネットワーク接続を確認してください。",
				cause: error,
			});
		}

		// その他のエラー（ネットワークエラー）
		return err({
			code: "NETWORK_ERROR",
			message:
				"ネットワークエラーが発生しました。インターネット接続を確認してください。",
			cause: error,
		});
	}
}

// ============================================================
// プロバイダ別検証関数
// ============================================================

/**
 * Claude APIキーを検証する
 *
 * Anthropic API `/v1/messages` エンドポイントへテスト接続を行い、
 * APIキーの有効性を確認します。最小限のリクエストでトークン消費を抑えます。
 *
 * @param apiKey - 検証対象のClaude APIキー
 * @returns 検証結果（成功時はOk(void)、失敗時はErr(ApiKeyValidationError)）
 *
 * @example
 * ```typescript
 * const result = await validateClaudeKey('sk-ant-api03-xxxxx');
 * if (isOk(result)) {
 *   console.log('Claude APIキーは有効です');
 * }
 * ```
 */
export async function validateClaudeKey(
	apiKey: string,
): Promise<Result<void, ApiKeyValidationError>> {
	// まず形式チェック
	const formatResult = validateApiKeyFormat("claude", apiKey);
	if (isErr(formatResult)) {
		return formatResult;
	}

	// API接続テスト
	const fetchResult = await fetchWithTimeout(
		ANTHROPIC_API_ENDPOINT,
		{
			method: "POST",
			headers: {
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
				"content-type": "application/json",
			},
			body: JSON.stringify({
				model: "claude-3-haiku-20240307",
				max_tokens: 1,
				messages: [{ role: "user", content: "Hi" }],
			}),
		},
		API_TIMEOUT_MS,
	);

	if (isErr(fetchResult)) {
		return fetchResult;
	}

	const response = fetchResult.value;

	// 認証エラー（401）
	if (response.status === 401) {
		return err({
			code: "API_ERROR",
			message: "APIキーが無効です。正しいキーを入力してください。",
		});
	}

	// 権限エラー（403）
	if (response.status === 403) {
		return err({
			code: "API_ERROR",
			message:
				"APIキーの権限が不足しています。APIキーの設定を確認してください。",
		});
	}

	// レート制限（429）
	if (response.status === 429) {
		return err({
			code: "API_ERROR",
			message:
				"APIのレート制限に達しました。しばらく待ってから再試行してください。",
		});
	}

	// その他のエラー（5xx等）
	if (!response.ok && response.status >= 500) {
		return err({
			code: "API_ERROR",
			message: `Anthropic APIでサーバーエラーが発生しました（${response.status}）。しばらく待ってから再試行してください。`,
		});
	}

	// 成功（200-299）または想定内のエラー（400等）でも認証は通っている
	return ok(undefined);
}

/**
 * OpenAI APIキーを検証する
 *
 * OpenAI API `/v1/models` エンドポイントで認証確認を行います。
 * このエンドポイントは認証確認のみでトークン消費はありません。
 *
 * @param apiKey - 検証対象のOpenAI APIキー
 * @returns 検証結果（成功時はOk(void)、失敗時はErr(ApiKeyValidationError)）
 *
 * @example
 * ```typescript
 * const result = await validateOpenAIKey('sk-xxxxx');
 * if (isOk(result)) {
 *   console.log('OpenAI APIキーは有効です');
 * }
 * ```
 */
export async function validateOpenAIKey(
	apiKey: string,
): Promise<Result<void, ApiKeyValidationError>> {
	// まず形式チェック
	const formatResult = validateApiKeyFormat("openai", apiKey);
	if (isErr(formatResult)) {
		return formatResult;
	}

	// API接続テスト（/v1/models はGETリクエストで認証確認のみ）
	const fetchResult = await fetchWithTimeout(
		OPENAI_API_ENDPOINT,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
		},
		API_TIMEOUT_MS,
	);

	if (isErr(fetchResult)) {
		return fetchResult;
	}

	const response = fetchResult.value;

	// 認証エラー（401）
	if (response.status === 401) {
		return err({
			code: "API_ERROR",
			message: "APIキーが無効です。正しいキーを入力してください。",
		});
	}

	// 権限エラー（403）
	if (response.status === 403) {
		return err({
			code: "API_ERROR",
			message:
				"APIキーの権限が不足しています。APIキーの設定を確認してください。",
		});
	}

	// レート制限（429）
	if (response.status === 429) {
		return err({
			code: "API_ERROR",
			message:
				"APIのレート制限に達しました。しばらく待ってから再試行してください。",
		});
	}

	// サーバーエラー（5xx）
	if (!response.ok && response.status >= 500) {
		return err({
			code: "API_ERROR",
			message: `OpenAI APIでサーバーエラーが発生しました（${response.status}）。しばらく待ってから再試行してください。`,
		});
	}

	// その他のエラー
	if (!response.ok) {
		return err({
			code: "API_ERROR",
			message: `OpenAI API接続エラー（${response.status}）。APIキーを確認してください。`,
		});
	}

	return ok(undefined);
}

/**
 * Ollamaサーバーへの接続を確認する
 *
 * 指定されたベースURLの `/api/tags` エンドポイントに接続し、
 * サーバーの稼働状況と利用可能なモデル一覧を取得します。
 *
 * @param baseUrl - OllamaサーバーのベースURL（省略時は http://localhost:11434）
 * @returns 接続結果（成功時はOk(OllamaConnectionResult)、失敗時はErr(ApiKeyValidationError)）
 *
 * @example
 * ```typescript
 * const result = await validateOllamaConnection();
 * if (isOk(result)) {
 *   console.log('利用可能なモデル:', result.value.availableModels);
 * }
 * ```
 */
export async function validateOllamaConnection(
	baseUrl: string = DEFAULT_OLLAMA_BASE_URL,
): Promise<Result<OllamaConnectionResult, ApiKeyValidationError>> {
	const tagsUrl = `${baseUrl}/api/tags`;

	const fetchResult = await fetchWithTimeout(
		tagsUrl,
		{
			method: "GET",
		},
		API_TIMEOUT_MS,
	);

	if (isErr(fetchResult)) {
		// ネットワークエラーの場合、より具体的なメッセージに変換
		const originalError = fetchResult.error;
		if (originalError.code === "NETWORK_ERROR") {
			return err({
				code: "NETWORK_ERROR",
				message:
					"Ollamaサーバーに接続できません。Ollamaが起動しているか確認してください。`ollama serve`でサーバーを起動できます。",
				cause: originalError.cause,
			});
		}
		return fetchResult;
	}

	const response = fetchResult.value;

	if (!response.ok) {
		return err({
			code: "API_ERROR",
			message: `Ollamaサーバーに接続できませんでした（${response.status}）。Ollamaが正しく起動しているか確認してください。`,
		});
	}

	// レスポンスをパース
	try {
		const data = (await response.json()) as {
			models?: Array<{ name: string }>;
		};
		const models = data.models?.map((m) => m.name) ?? [];

		return ok({
			connected: true,
			availableModels: models,
		});
	} catch (error) {
		return err({
			code: "API_ERROR",
			message:
				"Ollamaサーバーからのレスポンスを解析できませんでした。Ollamaのバージョンを確認してください。",
			cause: error,
		});
	}
}

// ============================================================
// 統合検証関数
// ============================================================

/**
 * プロバイダに応じたAPIキーの検証を行う
 *
 * 形式チェックと接続テストを統合した検証関数です。
 * プロバイダに応じて適切な検証関数を呼び出します。
 *
 * - Claude: Anthropic API `/v1/messages` へのテスト接続
 * - OpenAI: OpenAI API `/v1/models` での認証確認
 * - Ollama: 指定されたURLへの接続確認
 *
 * @param provider - LLMプロバイダ識別子
 * @param key - 検証対象のAPIキー（Ollamaの場合はベースURL）
 * @returns 検証結果（成功時はOk(void)、失敗時はErr(ApiKeyValidationError)）
 *
 * @example
 * ```typescript
 * // Claude APIキーの検証
 * const claudeResult = await validateApiKey('claude', 'sk-ant-xxxxx');
 *
 * // OpenAI APIキーの検証
 * const openaiResult = await validateApiKey('openai', 'sk-xxxxx');
 *
 * // Ollama接続の検証
 * const ollamaResult = await validateApiKey('ollama', 'http://localhost:11434');
 * ```
 */
export async function validateApiKey(
	provider: LLMProvider,
	key: string,
): Promise<Result<void, ApiKeyValidationError>> {
	switch (provider) {
		case "claude": {
			return validateClaudeKey(key);
		}
		case "openai": {
			return validateOpenAIKey(key);
		}
		case "ollama": {
			// Ollamaの場合はkeyをベースURLとして使用
			const result = await validateOllamaConnection(
				key || DEFAULT_OLLAMA_BASE_URL,
			);
			if (isErr(result)) {
				return result;
			}
			// OllamaConnectionResult を void に変換
			return ok(undefined);
		}
	}
}
