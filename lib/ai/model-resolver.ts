import { createProvider, type LLMProvider } from "@/lib/ai/providers";
import type { LLMConfig } from "@/lib/config/types";
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
 */
export async function resolveLLMProvider(
	ctx: CalendarContext,
): Promise<Result<LLMProvider, ModelResolverError>> {
	// 1. LLM設定を取得
	const settingResult = await ctx.configRepository.getSetting("llm");
	if (!isOk(settingResult)) {
		return err({
			code: "CONFIG_NOT_FOUND",
			message: "LLM設定の取得に失敗しました",
		});
	}

	// 設定がない場合はデフォルト(claude)を使用
	const llmConfig: LLMConfig = settingResult.value
		? (JSON.parse(settingResult.value) as LLMConfig)
		: { provider: "claude" };

	// 2. APIキーを取得（ollamaはAPIキー不要）
	let apiKey = "";
	if (llmConfig.provider !== "ollama") {
		const keyName = llmConfig.apiKeyRef ?? `${llmConfig.provider}-api-key`;
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
