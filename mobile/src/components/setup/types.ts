/**
 * セットアップUI型定義モジュール
 *
 * セットアップウィザードで使用する型定義とプロバイダ情報を提供します。
 * Web版の components/setup/types.ts をモバイル向けに移植。
 *
 * @module components/setup/types
 */

// ============================================================
// LLMプロバイダ型（lib/config/types.ts から独立定義）
// ============================================================

/** LLMプロバイダの識別子 */
export type LLMProvider = "claude" | "openai" | "ollama" | "gemini";

// ============================================================
// プロバイダ表示情報
// ============================================================

/**
 * プロバイダ表示情報
 */
export interface ProviderInfo {
	/** 表示名 */
	readonly name: string;
	/** 説明文 */
	readonly description: string;
	/** 推奨プロバイダかどうか */
	readonly isRecommended: boolean;
	/** APIキーが必要かどうか */
	readonly requiresApiKey: boolean;
	/** APIキーの正規表現パターン（検証用） */
	readonly apiKeyPattern?: RegExp;
	/** APIキー取得方法のヘルプURL */
	readonly apiKeyHelpUrl?: string;
	/** アイコンパス（Web向け、モバイルでは使用しない場合あり） */
	readonly iconPath: string;
}

/**
 * プロバイダ情報マップ
 */
export const PROVIDER_INFO: Record<LLMProvider, ProviderInfo> = {
	claude: {
		name: "Claude (Anthropic)",
		description:
			"Anthropic社の高性能AIモデル。自然な対話と高い推論能力が特徴。",
		isRecommended: true,
		requiresApiKey: true,
		apiKeyPattern: /^sk-ant-/,
		apiKeyHelpUrl: "https://console.anthropic.com/settings/keys",
		iconPath: "/icons/anthropic.svg",
	},
	openai: {
		name: "OpenAI",
		description: "OpenAI社のGPTモデル。幅広いタスクに対応。",
		isRecommended: false,
		requiresApiKey: true,
		apiKeyPattern: /^sk-/,
		apiKeyHelpUrl: "https://platform.openai.com/api-keys",
		iconPath: "/icons/openai.svg",
	},
	ollama: {
		name: "Ollama",
		description: "ローカルで動作するオープンソースモデル。プライバシー重視。",
		isRecommended: false,
		requiresApiKey: false,
		iconPath: "/icons/ollama.svg",
	},
	gemini: {
		name: "Gemini (Google)",
		description: "Google社の最新AIモデル。高速で多機能。",
		isRecommended: false,
		requiresApiKey: true,
		apiKeyPattern: /^AIza/,
		apiKeyHelpUrl: "https://aistudio.google.com/app/apikey",
		iconPath: "/icons/gemini.svg",
	},
};

// ============================================================
// セットアップステップ
// ============================================================

/** セットアップステップの識別子 */
export type SetupStep = "calendar" | "ai" | "complete";

/** ステップ情報 */
export interface StepInfo {
	/** ステップID */
	readonly id: SetupStep;
	/** ステップのラベル */
	readonly label: string;
	/** ステップの説明 */
	readonly description: string;
}

/** ステップ一覧 */
export const SETUP_STEPS: readonly StepInfo[] = [
	{
		id: "calendar",
		label: "カレンダー設定",
		description: "カレンダーを連携",
	},
	{ id: "ai", label: "AI設定", description: "AIプロバイダを設定" },
	{ id: "complete", label: "完了", description: "セットアップ完了" },
] as const;

/**
 * ステップIDからインデックスを取得
 */
export function getStepIndex(step: SetupStep): number {
	return SETUP_STEPS.findIndex((s) => s.id === step);
}
