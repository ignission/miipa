export interface ChatMessage {
	role: "user" | "assistant" | "system";
	content: string;
}

export interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
}

export interface ToolCall {
	id: string;
	name: string;
	arguments: Record<string, unknown>;
}

export type StreamEventType = "text" | "tool_call" | "done" | "error";

export interface StreamEvent {
	type: StreamEventType;
	text?: string;
	toolCall?: ToolCall;
	error?: string;
}

export interface LLMProviderOptions {
	messages: ChatMessage[];
	tools?: ToolDefinition[];
	systemPrompt?: string;
	maxTokens?: number;
}

export interface LLMResponse {
	content: string;
	toolCalls: ToolCall[];
	stopReason: "end_turn" | "tool_use" | "max_tokens" | "error";
}

export interface LLMProvider {
	chat(options: LLMProviderOptions): Promise<LLMResponse>;
	chatStream(options: LLMProviderOptions): Promise<ReadableStream<StreamEvent>>;
}
