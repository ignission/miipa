import type {
	ChatMessage,
	LLMProvider,
	LLMProviderOptions,
	LLMResponse,
	StreamEvent,
	ToolCall,
	ToolDefinition,
} from "./types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o";

interface OpenAIToolCallDelta {
	index: number;
	id?: string;
	function?: {
		name?: string;
		arguments?: string;
	};
}

interface OpenAIMessage {
	content: string | null;
	tool_calls?: {
		id: string;
		function: { name: string; arguments: string };
	}[];
}

interface OpenAIChoice {
	message: OpenAIMessage;
	finish_reason: string;
}

interface OpenAIResponse {
	choices: OpenAIChoice[];
}

function buildMessages(
	messages: ChatMessage[],
	systemPrompt?: string,
): { role: string; content: string }[] {
	const result: { role: string; content: string }[] = [];

	if (systemPrompt) {
		result.push({ role: "system", content: systemPrompt });
	}

	for (const m of messages) {
		result.push({ role: m.role, content: m.content });
	}

	return result;
}

function buildTools(tools: ToolDefinition[]): {
	type: "function";
	function: {
		name: string;
		description: string;
		parameters: Record<string, unknown>;
	};
}[] {
	return tools.map((t) => ({
		type: "function" as const,
		function: {
			name: t.name,
			description: t.description,
			parameters: t.inputSchema,
		},
	}));
}

function buildRequestBody(
	options: LLMProviderOptions,
	model: string,
	stream: boolean,
): Record<string, unknown> {
	const body: Record<string, unknown> = {
		model,
		messages: buildMessages(options.messages, options.systemPrompt),
	};

	if (options.maxTokens) {
		body.max_tokens = options.maxTokens;
	}

	if (options.tools && options.tools.length > 0) {
		body.tools = buildTools(options.tools);
	}

	if (stream) {
		body.stream = true;
		body.stream_options = { include_usage: true };
	}

	return body;
}

function parseResponse(data: OpenAIResponse): LLMResponse {
	const choice = data.choices[0];
	if (!choice) {
		return { content: "", toolCalls: [], stopReason: "error" };
	}

	const content = choice.message.content ?? "";
	const toolCalls: ToolCall[] = (choice.message.tool_calls ?? []).map((tc) => {
		let args: Record<string, unknown> = {};
		try {
			args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
		} catch {
			// JSON不正時は空オブジェクト
		}
		return { id: tc.id, name: tc.function.name, arguments: args };
	});

	const stopReason =
		choice.finish_reason === "stop"
			? "end_turn"
			: choice.finish_reason === "tool_calls"
				? "tool_use"
				: choice.finish_reason === "length"
					? "max_tokens"
					: "error";

	return { content, toolCalls, stopReason };
}

function createHeaders(apiKey: string): Record<string, string> {
	return {
		Authorization: `Bearer ${apiKey}`,
		"Content-Type": "application/json",
	};
}

function parseStreamEvents(
	body: ReadableStream<Uint8Array>,
): ReadableStream<StreamEvent> {
	let buffer = "";
	const decoder = new TextDecoder();

	// ストリーム中のtool_callを蓄積
	const pendingToolCalls = new Map<
		number,
		{ id: string; name: string; argsBuf: string }
	>();

	function processLine(line: string): StreamEvent[] {
		if (!line.startsWith("data: ")) return [];
		const payload = line.slice(6).trim();

		if (payload === "[DONE]") {
			// [DONE]の前に溜まっているtool_callsを全てflush
			const events: StreamEvent[] = [];
			for (const [, pending] of pendingToolCalls) {
				let args: Record<string, unknown> = {};
				try {
					args = JSON.parse(pending.argsBuf || "{}") as Record<string, unknown>;
				} catch {
					// JSON不正時は空オブジェクト
				}
				events.push({
					type: "tool_call",
					toolCall: {
						id: pending.id,
						name: pending.name,
						arguments: args,
					},
				});
			}
			pendingToolCalls.clear();
			events.push({ type: "done" });
			return events;
		}

		let chunk: Record<string, unknown>;
		try {
			chunk = JSON.parse(payload) as Record<string, unknown>;
		} catch {
			return [];
		}

		const choices = chunk.choices as
			| { delta: Record<string, unknown>; finish_reason?: string }[]
			| undefined;
		if (!choices || choices.length === 0) return [];

		const delta = choices[0].delta;
		const events: StreamEvent[] = [];

		// テキストデルタ
		if (typeof delta.content === "string" && delta.content) {
			events.push({ type: "text", text: delta.content });
		}

		// ツールコールデルタ
		const tcDeltas = delta.tool_calls as OpenAIToolCallDelta[] | undefined;
		if (tcDeltas) {
			for (const tcd of tcDeltas) {
				const existing = pendingToolCalls.get(tcd.index);
				if (!existing) {
					pendingToolCalls.set(tcd.index, {
						id: tcd.id ?? "",
						name: tcd.function?.name ?? "",
						argsBuf: tcd.function?.arguments ?? "",
					});
				} else {
					if (tcd.function?.arguments) {
						existing.argsBuf += tcd.function.arguments;
					}
				}
			}
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

export function createOpenAIProvider(
	apiKey: string,
	model?: string,
	baseUrl?: string,
): LLMProvider {
	const resolvedModel = model ?? DEFAULT_MODEL;
	const resolvedBaseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
	const endpoint = `${resolvedBaseUrl}/chat/completions`;

	return {
		async chat(options: LLMProviderOptions): Promise<LLMResponse> {
			const body = buildRequestBody(options, resolvedModel, false);

			const response = await fetch(endpoint, {
				method: "POST",
				headers: createHeaders(apiKey),
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				await response.text();
				return { content: "", toolCalls: [], stopReason: "error" };
			}

			const data = (await response.json()) as OpenAIResponse;
			return parseResponse(data);
		},

		async chatStream(
			options: LLMProviderOptions,
		): Promise<ReadableStream<StreamEvent>> {
			const body = buildRequestBody(options, resolvedModel, true);

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
							error: `OpenAI APIエラー (${response.status}): ${errorText}`,
						});
						controller.close();
					},
				});
			}

			return parseStreamEvents(response.body);
		},
	};
}
