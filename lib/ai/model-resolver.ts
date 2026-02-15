import { createProvider, type LLMProvider } from "@/lib/ai/providers";
import { type LLMConfig, LLMConfigSchema } from "@/lib/config/types";
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
	let llmConfig: LLMConfig;
	if (settingResult.value) {
		// JSON.parseの失敗とスキーマ不一致をZodのsafeParseで安全に処理
		let rawJson: unknown;
		try {
			rawJson = JSON.parse(settingResult.value);
		} catch {
			console.error(
				"LLM設定のJSONパースに失敗しました。デフォルト設定を使用します。",
			);
			rawJson = {};
		}
		const parseResult = LLMConfigSchema.safeParse(rawJson);
		if (parseResult.success) {
			llmConfig = parseResult.data;
		} else {
			console.error(
				"LLM設定のバリデーションに失敗しました。デフォルト設定を使用します:",
				parseResult.error.issues,
			);
			llmConfig = { provider: "claude" };
		}
	} else {
		llmConfig = { provider: "claude" };
	}

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
