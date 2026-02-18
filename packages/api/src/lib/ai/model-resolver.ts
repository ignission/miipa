import { createProvider, type LLMProvider } from "@/lib/ai/providers";
import { getSecretKeyForProvider } from "@/lib/application/setup/types";
import { isLLMProvider, type LLMConfig } from "@/lib/config/types";
import type { CalendarContext } from "@/lib/context/calendar-context";
import { err, isOk, ok, type Result } from "@/lib/domain/shared/result";

// ============================================================
// 型定義
// ============================================================

export type ModelResolverErrorCode =
	| "CONFIG_NOT_FOUND"
	| "API_KEY_NOT_FOUND"
	| "PROVIDER_ERROR";

export interface ModelResolverError {
	readonly code: ModelResolverErrorCode;
	readonly message: string;
}

// ============================================================
// リゾルバー
// ============================================================

/**
 * CalendarContextからLLM設定を読み取り、プロバイダインスタンスを生成
 *
 * D1のsettingsテーブルから個別キー（llm_provider, llm_model, llm_base_url）を
 * 読み取り、LLMConfigを構築してプロバイダインスタンスを生成します。
 */
export async function resolveLLMProvider(
	ctx: CalendarContext,
): Promise<Result<LLMProvider, ModelResolverError>> {
	// 1. LLM設定を個別キーから取得
	const providerResult = await ctx.configRepository.getSetting("llm_provider");
	if (!isOk(providerResult)) {
		return err({
			code: "CONFIG_NOT_FOUND",
			message: "LLM設定の取得に失敗しました",
		});
	}

	// プロバイダが未設定またはバリデーション失敗の場合はデフォルト(claude)を使用
	const rawProvider = providerResult.value;
	const provider = isLLMProvider(rawProvider) ? rawProvider : "claude";

	// モデル名を取得（オプション）
	const modelResult = await ctx.configRepository.getSetting("llm_model");
	const model =
		isOk(modelResult) && modelResult.value ? modelResult.value : undefined;

	// ベースURLを取得（オプション、主にOllama用）
	const baseUrlResult = await ctx.configRepository.getSetting("llm_base_url");
	const baseUrl =
		isOk(baseUrlResult) && baseUrlResult.value
			? baseUrlResult.value
			: undefined;

	// LLMConfigを構築
	const llmConfig: LLMConfig = {
		provider,
		...(model !== undefined && { model }),
		...(baseUrl !== undefined && { baseUrl }),
	};

	// 2. APIキーを取得（ollamaはAPIキー不要）
	let apiKey = "";
	if (llmConfig.provider !== "ollama") {
		const keyName = getSecretKeyForProvider(llmConfig.provider);
		const keyResult = await ctx.secretRepository.getSecret(keyName);
		if (!isOk(keyResult) || !keyResult.value) {
			return err({
				code: "API_KEY_NOT_FOUND",
				message: `APIキーが見つかりません: ${keyName}。設定画面でAPIキーを登録してください。`,
			});
		}
		apiKey = keyResult.value;
	}

	// 3. プロバイダ生成
	try {
		const provider = createProvider(llmConfig, apiKey);
		return ok(provider);
	} catch (e) {
		return err({
			code: "PROVIDER_ERROR",
			message:
				e instanceof Error ? e.message : "プロバイダの生成に失敗しました",
		});
	}
}
