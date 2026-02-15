import type {
	LLMProvider,
	LLMProviderOptions,
	LLMResponse,
	StreamEvent,
	ToolCall,
	ToolDefinition,
} from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 4096;

interface AnthropicContentBlock {
	type: "text" | "tool_use";
	text?: string;
	id?: string;
	name?: string;
	input?: Record<string, unknown>;
}

interface AnthropicResponse {
	content: AnthropicContentBlock[];
	stop_reason: string;
}

function buildTools(tools: ToolDefinition[]): {
	name: string;
	description: string;
	input_schema: Record<string, unknown>;
}[] {
	return tools.map((t) => ({
		name: t.name,
		description: t.description,
		input_schema: t.inputSchema,
	}));
}

function buildRequestBody(
	options: LLMProviderOptions,
	model: string,
	stream: boolean,
): Record<string, unknown> {
	const body: Record<string, unknown> = {
		model,
		max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
		messages: options.messages
			.filter((m) => m.role !== "system")
			.map((m) => ({ role: m.role, content: m.content })),
	};

	if (options.systemPrompt) {
		body.system = options.systemPrompt;
	}

	if (options.tools && options.tools.length > 0) {
		body.tools = buildTools(options.tools);
	}

	if (stream) {
		body.stream = true;
	}

	return body;
}

function parseResponse(data: AnthropicResponse): LLMResponse {
	let content = "";
	const toolCalls: ToolCall[] = [];

	for (const block of data.content) {
		if (block.type === "text" && block.text) {
			content += block.text;
		} else if (block.type === "tool_use" && block.id && block.name) {
			toolCalls.push({
				id: block.id,
				name: block.name,
				arguments: block.input ?? {},
			});
		}
	}

	const stopReason =
		data.stop_reason === "end_turn"
			? "end_turn"
			: data.stop_reason === "tool_use"
				? "tool_use"
				: data.stop_reason === "max_tokens"
					? "max_tokens"
					: "error";

	return { content, toolCalls, stopReason } satisfies LLMResponse;
}

function createHeaders(apiKey: string): Record<string, string> {
	return {
		"x-api-key": apiKey,
		"anthropic-version": "2023-06-01",
		"content-type": "application/json",
	};
}

function parseStreamEvents(
	body: ReadableStream<Uint8Array>,
): ReadableStream<StreamEvent> {
	let buffer = "";
	const decoder = new TextDecoder();

	// ストリーム中のtool_use blockを管理
	const pendingToolCalls = new Map<
		number,
		{ id: string; name: string; jsonBuf: string }
	>();

	function processLine(line: string): StreamEvent | null {
		if (!line.startsWith("data: ")) return null;
		const json = line.slice(6).trim();
		if (!json) return null;

		let event: Record<string, unknown>;
		try {
			event = JSON.parse(json) as Record<string, unknown>;
		} catch {
			return null;
		}

		const eventType = event.type as string;

		if (eventType === "content_block_start") {
			const block = event.content_block as Record<string, unknown> | undefined;
			if (block?.type === "tool_use") {
				const index = event.index as number;
				pendingToolCalls.set(index, {
					id: block.id as string,
					name: block.name as string,
					jsonBuf: "",
				});
			}
			return null;
		}

		if (eventType === "content_block_delta") {
			const delta = event.delta as Record<string, unknown> | undefined;
			if (!delta) return null;

			if (delta.type === "text_delta" && typeof delta.text === "string") {
				return { type: "text", text: delta.text };
			}

			if (
				delta.type === "input_json_delta" &&
				typeof delta.partial_json === "string"
			) {
				const index = event.index as number;
				const pending = pendingToolCalls.get(index);
				if (pending) {
					pending.jsonBuf += delta.partial_json;
				}
				return null;
			}
			return null;
		}

		if (eventType === "content_block_stop") {
			const index = event.index as number;
			const pending = pendingToolCalls.get(index);
			if (pending) {
				pendingToolCalls.delete(index);
				let args: Record<string, unknown> = {};
				try {
					args = JSON.parse(pending.jsonBuf || "{}") as Record<string, unknown>;
				} catch {
					// JSON不正時は空オブジェクト
				}
				return {
					type: "tool_call",
					toolCall: { id: pending.id, name: pending.name, arguments: args },
				};
			}
			return null;
		}

		if (eventType === "message_stop") {
			return { type: "done" };
		}

		if (eventType === "error") {
			const errorObj = event.error as Record<string, unknown> | undefined;
			return {
				type: "error",
				error: (errorObj?.message as string) ?? "不明なストリームエラー",
			};
		}

		return null;
	}

	return new ReadableStream<StreamEvent>({
		async start(controller) {
			const reader = body.getReader();

			try {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) {
						// 残りのバッファを処理
						if (buffer.trim()) {
							const evt = processLine(buffer.trim());
							if (evt) controller.enqueue(evt);
						}
						controller.enqueue({ type: "done" });
						controller.close();
						return;
					}

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					// 最後の不完全な行をバッファに残す
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed) continue;
						const evt = processLine(trimmed);
						if (evt) {
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

export function createAnthropicProvider(
	apiKey: string,
	model?: string,
): LLMProvider {
	const resolvedModel = model ?? DEFAULT_MODEL;

	return {
		async chat(options: LLMProviderOptions): Promise<LLMResponse> {
			const body = buildRequestBody(options, resolvedModel, false);

			const response = await fetch(ANTHROPIC_API_URL, {
				method: "POST",
				headers: createHeaders(apiKey),
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				await response.text();
				return {
					content: "",
					toolCalls: [],
					stopReason: "error",
				} satisfies LLMResponse;
			}

			const data = (await response.json()) as AnthropicResponse;
			return parseResponse(data);
		},

		async chatStream(
			options: LLMProviderOptions,
		): Promise<ReadableStream<StreamEvent>> {
			const body = buildRequestBody(options, resolvedModel, true);

			const response = await fetch(ANTHROPIC_API_URL, {
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
							error: `Anthropic APIエラー (${response.status}): ${errorText}`,
						});
						controller.close();
					},
				});
			}

			return parseStreamEvents(response.body);
		},
	};
}
