import type { LLMConfig } from "@/lib/config/types";
import { createAnthropicProvider } from "./anthropic";
import { createGoogleProvider } from "./google";
import { createOpenAIProvider } from "./openai";
import type { LLMProvider } from "./types";

export function createProvider(config: LLMConfig, apiKey: string): LLMProvider {
	switch (config.provider) {
		case "claude":
			return createAnthropicProvider(apiKey, config.model);
		case "openai":
			return createOpenAIProvider(apiKey, config.model, config.baseUrl);
		case "ollama":
			return createOpenAIProvider(
				apiKey || "ollama",
				config.model || "llama3",
				config.baseUrl || "http://localhost:11434/v1",
			);
		case "gemini":
			return createGoogleProvider(apiKey, config.model);
		default: {
			const _exhaustiveCheck: never = config.provider;
			throw new Error(`未対応のプロバイダ: ${_exhaustiveCheck}`);
		}
	}
}

export type {
	ChatMessage,
	LLMProvider,
	LLMProviderOptions,
	LLMResponse,
	StreamEvent,
	StreamEventType,
	ToolCall,
	ToolDefinition,
	ToolResult,
} from "./types";
