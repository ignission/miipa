/**
 * セットアップUI型定義モジュール
 *
 * セットアップウィザードで使用する型定義とプロバイダ情報を提供します。
 *
 * @module components/setup/types
 */

import type { LLMProvider } from "@/lib/config/types";

/**
 * プロバイダ表示情報
 *
 * 各LLMプロバイダのUI表示に必要な情報を定義します。
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
	/** アイコンパス */
	readonly iconPath: string;
}

/**
 * プロバイダ情報マップ
 *
 * 各LLMプロバイダの表示情報を定義します。
 * UIコンポーネントでプロバイダ情報を参照する際に使用します。
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
};

/**
 * セットアップステップ
 *
 * セットアップウィザードの各ステップを識別する文字列リテラル型です。
 * - `provider`: プロバイダ選択ステップ
 * - `key`: APIキー入力ステップ
 * - `complete`: セットアップ完了ステップ
 */
export type SetupStep = "provider" | "key" | "complete";

/**
 * ステップ情報
 *
 * 各セットアップステップのUI表示に必要な情報を定義します。
 */
export interface StepInfo {
	/** ステップID */
	readonly id: SetupStep;
	/** ステップのラベル */
	readonly label: string;
	/** ステップの説明 */
	readonly description: string;
}

/**
 * ステップ一覧
 *
 * セットアップウィザードのステップ情報を順序付きで定義します。
 */
export const SETUP_STEPS: readonly StepInfo[] = [
	{
		id: "provider",
		label: "プロバイダ選択",
		description: "AIプロバイダを選択",
	},
	{ id: "key", label: "APIキー入力", description: "認証情報を設定" },
	{ id: "complete", label: "完了", description: "セットアップ完了" },
] as const;

/**
 * ステップIDからインデックスを取得
 *
 * @param step - ステップID
 * @returns ステップのインデックス（0始まり）、見つからない場合は-1
 */
export function getStepIndex(step: SetupStep): number {
	return SETUP_STEPS.findIndex((s) => s.id === step);
}

/**
 * ステップインデックスからステップ情報を取得
 *
 * @param index - ステップインデックス（0始まり）
 * @returns ステップ情報、範囲外の場合はundefined
 */
export function getStepInfo(index: number): StepInfo | undefined {
	return SETUP_STEPS[index];
}
