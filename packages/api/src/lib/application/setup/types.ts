/**
 * セットアップ関連の型定義モジュール
 *
 * miipaアプリケーションのセットアップ状態管理に関する型を定義します。
 * プロバイダとシークレットキーのマッピング、セットアップ状態の表現を提供します。
 *
 * @module lib/application/setup/types
 *
 * @example
 * ```typescript
 * import type { SetupStatus, ProviderSecretKeyMap } from '@/lib/application/setup/types';
 * import { getSecretKeyForProvider } from '@/lib/application/setup/types';
 *
 * // セットアップ状態の使用例
 * const status: SetupStatus = {
 *   isComplete: true,
 *   currentProvider: 'claude',
 *   hasApiKey: true,
 * };
 *
 * // プロバイダに対応するシークレットキーを取得
 * const secretKey = getSecretKeyForProvider('claude'); // 'anthropic-api-key'
 * ```
 */

import type { LLMProvider } from "@/lib/config/types";
import type { LLMSecretKey } from "@/lib/infrastructure/secret";

// ============================================================
// プロバイダとシークレットキーのマッピング
// ============================================================

/**
 * LLMプロバイダとKeychainシークレットキーの対応マップ型
 *
 * 各プロバイダに対応するAPIキーのKeychain保存キーを定義します。
 */
export type ProviderSecretKeyMap = {
	readonly [K in LLMProvider]: LLMSecretKey;
};

/**
 * プロバイダとシークレットキーの対応マップ
 *
 * 各LLMプロバイダに対応するKeychainシークレットキーを定義します。
 * - claude: anthropic-api-key
 * - openai: openai-api-key
 * - ollama: ollama-api-key
 * - gemini: gemini-api-key
 */
export const PROVIDER_SECRET_KEY_MAP: ProviderSecretKeyMap = {
	claude: "anthropic-api-key",
	openai: "openai-api-key",
	ollama: "ollama-api-key",
	gemini: "gemini-api-key",
} as const;

/**
 * LLMプロバイダに対応するシークレットキーを取得
 *
 * @param provider - LLMプロバイダ識別子
 * @returns 対応するKeychainシークレットキー
 *
 * @example
 * ```typescript
 * const key = getSecretKeyForProvider('claude');
 * // key = 'anthropic-api-key'
 *
 * const openaiKey = getSecretKeyForProvider('openai');
 * // openaiKey = 'openai-api-key'
 * ```
 */
export function getSecretKeyForProvider(provider: LLMProvider): LLMSecretKey {
	return PROVIDER_SECRET_KEY_MAP[provider];
}

// ============================================================
// セットアップ状態型
// ============================================================

/**
 * セットアップ完了状態を表す型
 *
 * アプリケーションのセットアップ状態を表現します。
 * 設定ファイルの存在、プロバイダ設定、APIキーの有無を含みます。
 *
 * @property isComplete - セットアップが完了しているかどうか
 * @property currentProvider - 現在設定されているLLMプロバイダ（未設定の場合はundefined）
 * @property hasApiKey - 選択されたプロバイダのAPIキーがKeychainに保存されているかどうか
 *
 * @example
 * ```typescript
 * // セットアップ完了状態
 * const completeStatus: SetupStatus = {
 *   isComplete: true,
 *   currentProvider: 'claude',
 *   hasApiKey: true,
 * };
 *
 * // 設定ファイル未作成状態
 * const initialStatus: SetupStatus = {
 *   isComplete: false,
 *   currentProvider: undefined,
 *   hasApiKey: false,
 * };
 *
 * // APIキー未設定状態
 * const incompleteStatus: SetupStatus = {
 *   isComplete: false,
 *   currentProvider: 'openai',
 *   hasApiKey: false,
 * };
 * ```
 */
export interface SetupStatus {
	/** セットアップが完了しているかどうか */
	readonly isComplete: boolean;

	/** 現在設定されているLLMプロバイダ（未設定の場合はundefined） */
	readonly currentProvider: LLMProvider | undefined;

	/** 選択されたプロバイダのAPIキーがKeychainに保存されているかどうか */
	readonly hasApiKey: boolean;
}

/**
 * セットアップ完了状態を生成するファクトリ関数
 *
 * @param params - セットアップ状態のパラメータ
 * @returns SetupStatusオブジェクト
 */
export function createSetupStatus(params: {
	currentProvider: LLMProvider | undefined;
	hasApiKey: boolean;
	calendarCount: number;
}): SetupStatus {
	const { currentProvider, hasApiKey, calendarCount } = params;

	// セットアップ完了条件:
	// - カレンダーが1つ以上登録されている
	// - または、プロバイダが設定されており、かつAPIキーが存在する（Ollamaは除く）
	const hasCalendar = calendarCount > 0;
	const hasValidProvider =
		currentProvider !== undefined &&
		(currentProvider === "ollama" || hasApiKey);
	const isComplete = hasCalendar || hasValidProvider;

	return {
		isComplete,
		currentProvider,
		hasApiKey,
	};
}

// ============================================================
// APIキー検証関連の型
// ============================================================

/**
 * APIキー検証エラーコード
 *
 * APIキー検証時に発生しうるエラーの種別を表します。
 *
 * - INVALID_FORMAT: APIキーの形式が不正（プレフィックス不一致など）
 * - API_ERROR: API呼び出しエラー（認証失敗、権限不足など）
 * - TIMEOUT: タイムアウト（3秒以内にレスポンスなし）
 * - NETWORK_ERROR: ネットワークエラー（接続不可、DNS解決失敗など）
 */
export type ApiKeyValidationErrorCode =
	| "INVALID_FORMAT"
	| "API_ERROR"
	| "TIMEOUT"
	| "NETWORK_ERROR";

/**
 * APIキー検証エラー
 *
 * APIキー検証時に発生するエラーを表現します。
 * discriminated union パターンにより、codeフィールドで具体的なエラー種別を判別できます。
 *
 * @property code - エラーコード（型判別に使用）
 * @property message - ユーザー向けエラーメッセージ（日本語）
 * @property cause - エラーの原因（デバッグ用、オプション）
 *
 * @example
 * ```typescript
 * // 形式エラー
 * const formatError: ApiKeyValidationError = {
 *   code: 'INVALID_FORMAT',
 *   message: 'Claude APIキーの形式が正しくありません。「sk-ant-」で始まる必要があります。',
 * };
 *
 * // ネットワークエラー
 * const networkError: ApiKeyValidationError = {
 *   code: 'NETWORK_ERROR',
 *   message: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
 *   cause: new Error('fetch failed'),
 * };
 * ```
 */
export interface ApiKeyValidationError {
	/** エラーコード */
	readonly code: ApiKeyValidationErrorCode;
	/** ユーザー向けエラーメッセージ */
	readonly message: string;
	/** エラーの原因（オプション） */
	readonly cause?: unknown;
}

/**
 * Ollama接続結果
 *
 * Ollamaサーバーへの接続確認結果を表現します。
 * 接続成功時は利用可能なモデル一覧も含みます。
 *
 * @property connected - 接続成功かどうか
 * @property availableModels - 利用可能なモデル名の配列
 * @property version - Ollamaのバージョン（取得できた場合）
 *
 * @example
 * ```typescript
 * const result: OllamaConnectionResult = {
 *   connected: true,
 *   availableModels: ['llama2', 'codellama', 'mistral'],
 *   version: '0.1.24',
 * };
 * ```
 */
export interface OllamaConnectionResult {
	/** 接続成功かどうか */
	readonly connected: boolean;
	/** 利用可能なモデル名の配列 */
	readonly availableModels: readonly string[];
	/** Ollamaのバージョン（オプション） */
	readonly version?: string;
}

// ============================================================
// セットアップ設定保存関連の型
// ============================================================

/**
 * セットアップ設定
 *
 * セットアップ時にユーザーが入力する設定値を表現します。
 * プロバイダに応じて必要なフィールドが異なります。
 *
 * - Claude/OpenAI: apiKeyが必須
 * - Ollama: baseUrl（オプション、デフォルト'http://localhost:11434'）とmodel（オプション）
 *
 * @property provider - LLMプロバイダ識別子（必須）
 * @property apiKey - APIキー（Claude/OpenAI用、オプション）
 * @property baseUrl - OllamaのベースURL（オプション、デフォルト'http://localhost:11434'）
 * @property model - 使用するモデル名（Ollama用、オプション）
 *
 * @example
 * ```typescript
 * // Claude設定
 * const claudeSettings: SetupSettings = {
 *   provider: 'claude',
 *   apiKey: 'sk-ant-xxx',
 * };
 *
 * // Ollama設定
 * const ollamaSettings: SetupSettings = {
 *   provider: 'ollama',
 *   baseUrl: 'http://localhost:11434',
 *   model: 'llama2',
 * };
 * ```
 */
export interface SetupSettings {
	/** LLMプロバイダ識別子（必須） */
	readonly provider: LLMProvider;
	/** APIキー（Claude/OpenAI用、オプション） */
	readonly apiKey?: string;
	/** OllamaのベースURL（オプション、デフォルト'http://localhost:11434'） */
	readonly baseUrl?: string;
	/** 使用するモデル名（Ollama用、オプション） */
	readonly model?: string;
}

/**
 * 設定保存オプション
 *
 * saveSetupSettings関数の動作を制御するオプションです。
 *
 * @property overwriteExisting - 既存のAPIキーを上書きするかどうか（デフォルトfalse）
 *
 * @example
 * ```typescript
 * // 既存キーを上書き
 * const options: SaveOptions = { overwriteExisting: true };
 *
 * // 既存キーがある場合はエラー（デフォルト）
 * const defaultOptions: SaveOptions = {};
 * ```
 */
export interface SaveOptions {
	/** 既存のAPIキーを上書きするかどうか（デフォルトfalse） */
	readonly overwriteExisting?: boolean;
}

/**
 * 設定保存エラーコード
 *
 * 設定保存時に発生しうるエラーの種別を表します。
 *
 * - KEY_EXISTS: 既存のAPIキーが存在し、上書きが許可されていない
 * - KEYCHAIN_ERROR: Keychain操作でエラーが発生
 * - CONFIG_ERROR: 設定ファイル操作でエラーが発生
 */
export type SaveSettingsErrorCode =
	| "KEY_EXISTS"
	| "KEYCHAIN_ERROR"
	| "CONFIG_ERROR";

/**
 * 設定保存エラー
 *
 * saveSetupSettings関数で発生するエラーを表現します。
 * discriminated unionパターンにより、codeフィールドで具体的なエラー種別を判別できます。
 *
 * @property code - エラーコード（型判別に使用）
 * @property message - ユーザー向けエラーメッセージ（日本語）
 * @property cause - エラーの原因（デバッグ用、オプション）
 *
 * @example
 * ```typescript
 * // 既存キーエラー
 * const keyExistsError: SaveSettingsError = {
 *   code: 'KEY_EXISTS',
 *   message: '既にAPIキーが設定されています。上書きする場合はoverwriteExistingをtrueに設定してください。',
 * };
 *
 * // 認証情報保存エラー
 * const secretError: SaveSettingsError = {
 *   code: 'KEYCHAIN_ERROR',
 *   message: '認証情報の保存に失敗しました。',
 *   cause: originalError,
 * };
 * ```
 */
export interface SaveSettingsError {
	/** エラーコード */
	readonly code: SaveSettingsErrorCode;
	/** ユーザー向けエラーメッセージ */
	readonly message: string;
	/** エラーの原因（オプション） */
	readonly cause?: unknown;
}
