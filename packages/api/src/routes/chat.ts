/**
 * チャット Hono ルート（SSEストリーミング対応）
 *
 * AIアシスタント「miipa」とのチャット機能を提供します。
 * ツール呼び出しループで非ストリーミング処理を行い、
 * 最終応答のみSSEストリーミングで返却します。
 *
 * 対応元: app/api/chat/route.ts → POST /chat, GET /chat
 */

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { AppType } from "@/context/app-context";
import type { ModelResolverError } from "@/lib/ai/model-resolver";
import { resolveLLMProvider } from "@/lib/ai/model-resolver";
import type {
	ChatMessage,
	LLMProvider,
	StreamEvent,
	ToolCall,
} from "@/lib/ai/providers";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import type { MiipaTools } from "@/lib/ai/tools";
import { createMiipaTools } from "@/lib/ai/tools";
import { buildCalendarContext } from "@/lib/context/build-calendar-context";
import { isOk } from "@/lib/domain/shared/result";

// ============================================================
// 定数
// ============================================================

/** ツール呼び出しループの最大回数 */
const MAX_TOOL_CALL_ITERATIONS = 5;

/** LLMに送信するメッセージの最大件数 */
const MAX_CONTEXT_MESSAGES = 6;

/** ユーザーメッセージ1件あたりの最大文字数 */
const MAX_MESSAGE_CONTENT_LENGTH = 10000;

/** 取得する会話履歴の最大件数 */
const MAX_HISTORY_COUNT = 50;

// ============================================================
// バリデーション
// ============================================================

/**
 * 受信メッセージが有効な ChatMessage 形式かを検証する型ガード
 *
 * クライアントからの不正な入力（role偽装、型不正等）を防止します。
 * OWASP A03:2021 - Injection 対策として、role を user/assistant に限定し
 * system prompt 注入を防ぎます。
 *
 * @param msg - 検証対象の値
 * @returns 有効な ChatMessage 形式であれば true
 */
function isValidMessage(msg: unknown): msg is ChatMessage {
	if (typeof msg !== "object" || msg === null) return false;
	const m = msg as Record<string, unknown>;
	if (typeof m.content !== "string") return false;
	if (m.role !== "user" && m.role !== "assistant") return false;
	return true;
}

/**
 * メッセージ配列をバリデーション・サニタイズする
 *
 * - 不正な形式のメッセージを除外
 * - role: "system" のメッセージを除外（system prompt注入防止）
 * - content文字数上限を超えるメッセージを切り詰め
 *
 * @param rawMessages - 未検証のメッセージ配列
 * @returns バリデーション済みの ChatMessage 配列、または null（全件無効の場合）
 */
function validateAndSanitizeMessages(
	rawMessages: unknown[],
): ChatMessage[] | null {
	const validated: ChatMessage[] = [];
	for (const msg of rawMessages) {
		if (!isValidMessage(msg)) continue;
		validated.push({
			role: msg.role,
			content: msg.content.slice(0, MAX_MESSAGE_CONTENT_LENGTH),
		});
	}
	return validated.length > 0 ? validated : null;
}

// ============================================================
// ツール呼び出しループ
// ============================================================

/**
 * ツール呼び出し結果を ChatMessage 形式に変換
 *
 * @param toolCalls - LLM からのツール呼び出し配列
 * @param tools - ツール群
 * @returns ツール結果を含む ChatMessage の配列
 */
async function executeToolCalls(
	toolCalls: readonly ToolCall[],
	tools: MiipaTools,
): Promise<ChatMessage[]> {
	const results: ChatMessage[] = [];

	for (const toolCall of toolCalls) {
		const result = await tools.execute(toolCall.name, toolCall.arguments);
		// XMLタグで囲み LLM にツール結果であることを明示（通常のユーザーメッセージと区別）
		results.push({
			role: "user",
			content: `<tool_result tool="${toolCall.name}">\n${result}\n</tool_result>`,
		});
	}

	return results;
}

/**
 * ツール呼び出しループを実行し最終テキスト応答を得る
 *
 * 非ストリーミングの chat() で LLM に問い合わせ、ツール呼び出しがあれば
 * 実行してメッセージに追加し、最大 MAX_TOOL_CALL_ITERATIONS 回繰り返します。
 * 最終的なテキスト応答を返します。
 *
 * @param provider - LLM プロバイダ
 * @param messages - 会話メッセージ配列
 * @param tools - ツール群
 * @param systemPrompt - システムプロンプト
 * @param onToolCall - ツール呼び出し時のコールバック
 * @returns 最終テキスト応答（ストリーミングすべき応答がある場合）、または null
 */
async function runToolCallLoop(
	provider: LLMProvider,
	messages: ChatMessage[],
	tools: MiipaTools,
	systemPrompt: string,
	onToolCall: (toolCall: ToolCall) => Promise<void>,
): Promise<string | null> {
	const workingMessages = [...messages];

	for (let i = 0; i < MAX_TOOL_CALL_ITERATIONS; i++) {
		const response = await provider.chat({
			messages: workingMessages,
			tools: tools.definitions,
			systemPrompt,
		});

		if (response.stopReason === "tool_use" && response.toolCalls.length > 0) {
			// ツール呼び出しイベントをコールバックで通知
			for (const toolCall of response.toolCalls) {
				await onToolCall(toolCall);
			}

			// ツール実行
			const toolResults = await executeToolCalls(response.toolCalls, tools);

			// アシスタントの応答とツール結果をメッセージに追加
			workingMessages.push({
				role: "assistant",
				content: response.content,
			});
			workingMessages.push(...toolResults);

			continue;
		}

		// end_turn または その他: 最終応答テキストを返す
		return response.content;
	}

	// ループ上限到達時は最後の chat() 結果を使う
	const lastResponse = await provider.chat({
		messages: workingMessages,
		systemPrompt,
	});
	return lastResponse.content;
}

// ============================================================
// 型定義
// ============================================================

/** 会話履歴レコードの型 */
interface ChatMessageRecord {
	readonly id: string;
	readonly user_id: string;
	readonly role: string;
	readonly content: string;
	readonly tool_calls: string | null;
	readonly created_at: string;
}

/** 会話履歴レスポンスの型 */
interface ChatHistoryResponse {
	readonly id: string;
	readonly role: string;
	readonly content: string;
	readonly toolCalls: ToolCall[] | null;
	readonly createdAt: string;
}

/**
 * JSON文字列を ToolCall 配列にパース（失敗時は null）
 */
function parseToolCalls(json: string | null): ToolCall[] | null {
	if (!json) return null;
	try {
		return JSON.parse(json) as ToolCall[];
	} catch {
		return null;
	}
}

// ============================================================
// ルート定義
// ============================================================

const chat = new Hono<AppType>();

/**
 * POST /chat - チャットメッセージ送信（SSEストリーミング応答）
 */
chat.post("/", async (c) => {
	const db = c.get("db");
	const userId = c.get("userId");

	const calendarCtx = await buildCalendarContext(
		db,
		userId,
		c.get("encryptionKey"),
	);
	if (!calendarCtx) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	// リクエストボディ取得
	let body: { messages?: ChatMessage[] };
	try {
		body = await c.req.json();
	} catch {
		return c.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディが不正です",
				},
			},
			400,
		);
	}

	const rawMessages = body.messages;
	if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
		return c.json(
			{ error: { code: "INVALID_REQUEST", message: "messagesは必須です" } },
			400,
		);
	}

	// メッセージのバリデーションとサニタイズ
	const validatedMessages = validateAndSanitizeMessages(rawMessages);
	if (!validatedMessages) {
		return c.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "有効なメッセージが含まれていません",
				},
			},
			400,
		);
	}

	// メッセージ数制限（直近N件のみLLMに送信）
	const messages = validatedMessages.slice(-MAX_CONTEXT_MESSAGES);

	// LLMプロバイダ生成
	const providerResult = await resolveLLMProvider(calendarCtx);
	if (!isOk(providerResult)) {
		const resolverError: ModelResolverError = providerResult.error;
		const status = resolverError.code === "API_KEY_NOT_FOUND" ? 400 : 500;
		return c.json(
			{ error: { code: resolverError.code, message: resolverError.message } },
			status,
		);
	}
	const provider: LLMProvider = providerResult.value;

	// ツール群生成
	const tools: MiipaTools = createMiipaTools(calendarCtx);

	// システムプロンプト生成
	const systemPrompt = buildSystemPrompt();

	// SSEストリーミングレスポンスを Hono streamSSE で構築
	return streamSSE(c, async (stream) => {
		try {
			// ツール呼び出しループ（非ストリーミング）
			const finalText = await runToolCallLoop(
				provider,
				messages,
				tools,
				systemPrompt,
				async (toolCall) => {
					await stream.writeSSE({
						data: JSON.stringify({
							type: "tool_call",
							toolCall,
						} as StreamEvent),
					});
				},
			);

			if (finalText !== null) {
				// 最終テキストをSSEで送信
				await stream.writeSSE({
					data: JSON.stringify({
						type: "text",
						text: finalText,
					} as StreamEvent),
				});

				// メッセージをD1に保存
				try {
					const lastUserMessage = messages[messages.length - 1];

					// 最後のメッセージが user ロールであることを確認（不正な role の保存を防止）
					if (lastUserMessage.role !== "user") {
						console.warn(
							"最後のメッセージがuserロールではありません:",
							lastUserMessage.role,
						);
					} else {
						// ユーザーメッセージ保存（ミリ秒精度のタイムスタンプで順序を保証）
						const userTimestamp = new Date().toISOString();
						await db
							.prepare(
								"INSERT INTO chat_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
							)
							.bind(
								crypto.randomUUID(),
								userId,
								lastUserMessage.role,
								lastUserMessage.content,
								userTimestamp,
							)
							.run();
					}

					// アシスタント応答保存（ユーザーメッセージとは別のタイムスタンプを取得）
					const assistantTimestamp = new Date().toISOString();
					await db
						.prepare(
							"INSERT INTO chat_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
						)
						.bind(
							crypto.randomUUID(),
							userId,
							"assistant",
							finalText,
							assistantTimestamp,
						)
						.run();
				} catch {
					// メッセージ保存が失敗してもチャット応答には影響させない
				}
			}

			// 完了イベント送信
			await stream.writeSSE({
				data: JSON.stringify({ type: "done" } as StreamEvent),
			});
		} catch (error) {
			// 内部エラー詳細はクライアントに返さない（OWASP A01:2021 - 情報漏洩防止）
			console.error("チャット処理エラー:", error);
			await stream.writeSSE({
				data: JSON.stringify({
					type: "error",
					error: "応答の生成中にエラーが発生しました",
				} as StreamEvent),
			});
		}
	});
});

/**
 * GET /chat - 会話履歴取得
 */
chat.get("/", async (c) => {
	const db = c.get("db");
	const userId = c.get("userId");

	try {
		const result = await db
			.prepare(
				`SELECT id, user_id, role, content, tool_calls, created_at
				FROM chat_messages
				WHERE user_id = ?
				ORDER BY created_at DESC, id DESC
				LIMIT ?`,
			)
			.bind(userId, MAX_HISTORY_COUNT)
			.all<ChatMessageRecord>();

		const chatMessages: ChatHistoryResponse[] = result.results
			.reverse()
			.map((record) => ({
				id: record.id,
				role: record.role,
				content: record.content,
				toolCalls: parseToolCalls(record.tool_calls),
				createdAt: record.created_at,
			}));

		return c.json({ messages: chatMessages });
	} catch (error) {
		console.error("[chat] 会話履歴取得エラー:", error);
		return c.json({ error: { code: "DB_ERROR", message: "会話履歴の取得に失敗しました" } }, 500);
	}
});

export { chat };
