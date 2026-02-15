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

interface GeminiPart {
	text?: string;
	functionCall?: { name: string; args: Record<string, unknown> };
}

interface GeminiCandidate {
	content: { parts: GeminiPart[] };
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
	let toolCallIndex = 0;

	for (const part of candidate.content.parts) {
		if (part.text) {
			content += part.text;
		}
		if (part.functionCall) {
			toolCalls.push({
				id: `call_${toolCallIndex++}`,
				name: part.functionCall.name,
				arguments: part.functionCall.args ?? {},
			});
		}
	}

	const stopReason =
		candidate.finishReason === "STOP"
			? "end_turn"
			: candidate.finishReason === "MAX_TOKENS"
				? "max_tokens"
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

function parseStreamEvents(
	body: ReadableStream<Uint8Array>,
): ReadableStream<StreamEvent> {
	let buffer = "";
	const decoder = new TextDecoder();

	function processLine(line: string): StreamEvent[] {
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
		let toolCallIndex = 0;

		for (const part of candidate.content.parts) {
			if (part.text) {
				events.push({ type: "text", text: part.text });
			}
			if (part.functionCall) {
				events.push({
					type: "tool_call",
					toolCall: {
						id: `call_${toolCallIndex++}`,
						name: part.functionCall.name,
						arguments: part.functionCall.args ?? {},
					},
				});
			}
		}

		// finishReasonがある場合はストリーム終了
		if (
			candidate.finishReason === "STOP" ||
			candidate.finishReason === "MAX_TOKENS"
		) {
			events.push({ type: "done" });
		}

		return events;
	}

	return new ReadableStream<StreamEvent>({
		async start(controller) {
			const reader = body.getReader();

			try {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) {
						if (buffer.trim()) {
							for (const evt of processLine(buffer.trim())) {
								controller.enqueue(evt);
							}
						}
						controller.enqueue({ type: "done" });
						controller.close();
						return;
					}

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed) continue;

						for (const evt of processLine(trimmed)) {
							controller.enqueue(evt);
							if (evt.type === "done" || evt.type === "error") {
								controller.close();
								reader.cancel();
								return;
							}
						}
					}
				}
			} catch (e) {
				controller.enqueue({
					type: "error",
					error: e instanceof Error ? e.message : "ストリーム読み取りエラー",
				});
				controller.close();
			}
		},
	});
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
				await response.text();
				return { content: "", toolCalls: [], stopReason: "error" };
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

			return parseStreamEvents(response.body);
		},
	};
}
