import { createSSEReadableStream } from "./stream-utils";
import type {
	ChatMessage,
	LLMProvider,
	LLMProviderOptions,
	LLMResponse,
	StreamEvent,
	ToolCall,
	ToolDefinition,
} from "./types";

const GEMINI_API_BASE =
	"https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

/** Gemini API の finishReason を内部表現にマッピング */
const STOP_REASON_MAP: Record<string, LLMResponse["stopReason"]> = {
	STOP: "end_turn",
	MAX_TOKENS: "max_tokens",
};

interface GeminiPart {
	text?: string;
	functionCall?: { name: string; args: Record<string, unknown> };
}

interface GeminiCandidate {
	content?: { parts: GeminiPart[] };
	finishReason?: string;
}

interface GeminiResponse {
	candidates: GeminiCandidate[];
}

function toGeminiRole(role: ChatMessage["role"]): "user" | "model" {
	return role === "assistant" ? "model" : "user";
}

function buildContents(
	messages: ChatMessage[],
): { role: "user" | "model"; parts: { text: string }[] }[] {
	return messages
		.filter((m) => m.role !== "system")
		.map((m) => ({
			role: toGeminiRole(m.role),
			parts: [{ text: m.content }],
		}));
}

function buildTools(tools: ToolDefinition[]): {
	functionDeclarations: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	}[];
}[] {
	return [
		{
			functionDeclarations: tools.map((t) => ({
				name: t.name,
				description: t.description,
				parameters: t.inputSchema,
			})),
		},
	];
}

function buildRequestBody(
	options: LLMProviderOptions,
): Record<string, unknown> {
	const body: Record<string, unknown> = {
		contents: buildContents(options.messages),
	};

	if (options.systemPrompt) {
		body.system_instruction = { parts: [{ text: options.systemPrompt }] };
	}

	if (options.tools && options.tools.length > 0) {
		body.tools = buildTools(options.tools);
	}

	if (options.maxTokens) {
		body.generationConfig = { maxOutputTokens: options.maxTokens };
	}

	return body;
}

function parseResponse(data: GeminiResponse): LLMResponse {
	const candidate = data.candidates?.[0];
	if (!candidate) {
		return { content: "", toolCalls: [], stopReason: "error" };
	}

	let content = "";
	const toolCalls: ToolCall[] = [];

	for (const part of candidate.content?.parts ?? []) {
		if (part.text) {
			content += part.text;
		}
		if (part.functionCall) {
			toolCalls.push({
				id: crypto.randomUUID(),
				name: part.functionCall.name,
				arguments: part.functionCall.args ?? {},
			});
		}
	}

	// finishReasonがマッピングにある場合はそれを使用、なければfunctionCall検出で判定
	const mappedReason = candidate.finishReason
		? STOP_REASON_MAP[candidate.finishReason]
		: undefined;
	const stopReason: LLMResponse["stopReason"] = mappedReason
		? mappedReason
		: candidate.finishReason
			? "error"
			: toolCalls.length > 0
				? "tool_use"
				: "end_turn";

	return { content, toolCalls, stopReason };
}

function createHeaders(apiKey: string): Record<string, string> {
	return {
		"x-goog-api-key": apiKey,
		"Content-Type": "application/json",
	};
}

/**
 * Gemini SSE の processLine コールバックを生成する。
 */
function createProcessLine(): (line: string) => StreamEvent[] {
	return (line: string): StreamEvent[] => {
		if (!line.startsWith("data: ")) return [];
		const payload = line.slice(6).trim();
		if (!payload) return [];

		let data: GeminiResponse;
		try {
			data = JSON.parse(payload) as GeminiResponse;
		} catch {
			return [];
		}

		const candidate = data.candidates?.[0];
		if (!candidate) return [];

		const events: StreamEvent[] = [];

		for (const part of candidate.content?.parts ?? []) {
			if (part.text) {
				events.push({ type: "text", text: part.text });
			}
			if (part.functionCall) {
				events.push({
					type: "tool_call",
					toolCall: {
						id: crypto.randomUUID(),
						name: part.functionCall.name,
						arguments: part.functionCall.args ?? {},
					},
				});
			}
		}

		// finishReasonがある場合はストリーム終了
		if (candidate.finishReason) {
			if (
				candidate.finishReason !== "STOP" &&
				candidate.finishReason !== "MAX_TOKENS"
			) {
				events.push({
					type: "error",
					error: `Gemini finishReason: ${candidate.finishReason}`,
				});
			}
			events.push({ type: "done" });
		}

		return events;
	};
}

export function createGoogleProvider(
	apiKey: string,
	model?: string,
): LLMProvider {
	const resolvedModel = model ?? DEFAULT_MODEL;

	return {
		async chat(options: LLMProviderOptions): Promise<LLMResponse> {
			const endpoint = `${GEMINI_API_BASE}/${resolvedModel}:generateContent`;
			const body = buildRequestBody(options);

			const response = await fetch(endpoint, {
				method: "POST",
				headers: createHeaders(apiKey),
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorBody = await response.text();
				return {
					content: `APIエラー (${response.status}): ${errorBody.slice(0, 200)}`,
					toolCalls: [],
					stopReason: "error",
				};
			}

			const data = (await response.json()) as GeminiResponse;
			return parseResponse(data);
		},

		async chatStream(
			options: LLMProviderOptions,
		): Promise<ReadableStream<StreamEvent>> {
			const endpoint = `${GEMINI_API_BASE}/${resolvedModel}:streamGenerateContent?alt=sse`;
			const body = buildRequestBody(options);

			const response = await fetch(endpoint, {
				method: "POST",
				headers: createHeaders(apiKey),
				body: JSON.stringify(body),
			});

			if (!response.ok || !response.body) {
				const errorText = await response.text().catch(() => "不明なエラー");
				return new ReadableStream<StreamEvent>({
					start(controller) {
						controller.enqueue({
							type: "error",
							error: `Gemini APIエラー (${response.status}): ${errorText}`,
						});
						controller.close();
					},
				});
			}

			return createSSEReadableStream(response.body, createProcessLine());
		},
	};
}
