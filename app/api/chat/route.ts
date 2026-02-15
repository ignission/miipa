/**
 * チャットAPI エンドポイント（SSEストリーミング対応）
 *
 * AIアシスタント「miipa」とのチャット機能を提供します。
 * ツール呼び出しループで非ストリーミング処理を行い、
 * 最終応答のみSSEストリーミングで返却します。
 *
 * @endpoint POST /api/chat - メッセージ送信（SSEストリーミング応答）
 * @endpoint GET /api/chat - 会話履歴取得
 */

import { type NextRequest, NextResponse } from "next/server";
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
import { isOk } from "@/lib/domain/shared/result";
import {
	type AuthenticatedContext,
	createAuthenticatedContext,
} from "@/lib/infrastructure/cloudflare/api-context";
import { getD1Database } from "@/lib/infrastructure/cloudflare/bindings";

// ============================================================
// 定数
// ============================================================

/** ツール呼び出しループの最大回数 */
const MAX_TOOL_CALL_ITERATIONS = 5;

/** LLMに送信するメッセージの最大件数 */
const MAX_CONTEXT_MESSAGES = 20;

/** ユーザーメッセージ1件あたりの最大文字数 */
const MAX_MESSAGE_CONTENT_LENGTH = 10000;

// ============================================================
// バリデーション
// ============================================================

/**
 * 受信メッセージが有効なChatMessage形式かを検証する型ガード
 *
 * クライアントからの不正な入力（role偽装、型不正等）を防止します。
 * OWASP A03:2021 - Injection 対策として、roleをuser/assistantに限定し
 * system prompt注入を防ぎます。
 *
 * @param msg - 検証対象の値
 * @returns 有効なChatMessage形式であればtrue
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
 * @returns バリデーション済みのChatMessage配列、またはnull（全件無効の場合）
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
// SSEヘルパー
// ============================================================

/**
 * SSEイベントをフォーマット
 *
 * @param event - 送信するストリームイベント
 * @returns SSE形式にフォーマットされた文字列
 */
function formatSSE(event: StreamEvent): string {
	return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * SSEレスポンスヘッダーを生成
 *
 * @returns SSEストリーミング用のレスポンスヘッダー
 */
function createSSEHeaders(): HeadersInit {
	return {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	};
}

// ============================================================
// ツール呼び出しループ
// ============================================================

/**
 * ツール呼び出し結果をChatMessage形式に変換
 *
 * @param toolCalls - LLMからのツール呼び出し配列
 * @param tools - ツール群
 * @returns ツール結果を含むChatMessageの配列
 */
async function executeToolCalls(
	toolCalls: readonly ToolCall[],
	tools: MiipaTools,
): Promise<ChatMessage[]> {
	const results: ChatMessage[] = [];

	for (const toolCall of toolCalls) {
		const result = await tools.execute(toolCall.name, toolCall.arguments);
		// XMLタグで囲みLLMにツール結果であることを明示（通常のユーザーメッセージと区別）
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
 * 非ストリーミングのchat()でLLMに問い合わせ、ツール呼び出しがあれば
 * 実行してメッセージに追加し、最大MAX_TOOL_CALL_ITERATIONS回繰り返します。
 * 最終的なテキスト応答を返します。
 *
 * @param provider - LLMプロバイダ
 * @param messages - 会話メッセージ配列
 * @param tools - ツール群
 * @param systemPrompt - システムプロンプト
 * @param writer - SSEイベント書き込み用のWritableStreamDefaultWriter
 * @param encoder - TextEncoder
 * @returns 最終テキスト応答（ストリーミングすべき応答がある場合）、またはnull
 */
async function runToolCallLoop(
	provider: LLMProvider,
	messages: ChatMessage[],
	tools: MiipaTools,
	systemPrompt: string,
	writer: WritableStreamDefaultWriter<Uint8Array>,
	encoder: TextEncoder,
): Promise<string | null> {
	const workingMessages = [...messages];

	for (let i = 0; i < MAX_TOOL_CALL_ITERATIONS; i++) {
		const response = await provider.chat({
			messages: workingMessages,
			tools: tools.definitions,
			systemPrompt,
		});

		if (response.stopReason === "tool_use" && response.toolCalls.length > 0) {
			// ツール呼び出しイベントをSSEで送信
			for (const toolCall of response.toolCalls) {
				await writer.write(
					encoder.encode(formatSSE({ type: "tool_call", toolCall })),
				);
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

	// ループ上限到達時は最後のchat()結果を使う
	const lastResponse = await provider.chat({
		messages: workingMessages,
		systemPrompt,
	});
	return lastResponse.content;
}

// ============================================================
// POST: チャットメッセージ送信
// ============================================================

/**
 * チャットメッセージを送信しSSEストリーミングで応答を返す
 *
 * @param request - Next.jsリクエストオブジェクト
 * @returns SSEストリーミングレスポンス
 */
export async function POST(request: NextRequest): Promise<Response> {
	// 1. 認証チェック
	const authResult = await createAuthenticatedContext();
	if (!isOk(authResult)) {
		return NextResponse.json(
			{
				error: {
					code: authResult.error.code,
					message: authResult.error.message,
				},
			},
			{ status: authResult.error.status },
		);
	}
	const authCtx: AuthenticatedContext = authResult.value;

	// 2. リクエストボディ取得
	let body: { messages?: ChatMessage[] };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディが不正です",
				},
			},
			{ status: 400 },
		);
	}

	const rawMessages = body.messages;
	if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
		return NextResponse.json(
			{ error: { code: "INVALID_REQUEST", message: "messagesは必須です" } },
			{ status: 400 },
		);
	}

	// 2-b. メッセージのバリデーションとサニタイズ
	const validatedMessages = validateAndSanitizeMessages(rawMessages);
	if (!validatedMessages) {
		return NextResponse.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "有効なメッセージが含まれていません",
				},
			},
			{ status: 400 },
		);
	}

	// 2-c. メッセージ数制限（直近N件のみLLMに送信）
	const messages = validatedMessages.slice(-MAX_CONTEXT_MESSAGES);

	// 3. LLMプロバイダ生成
	const providerResult = await resolveLLMProvider(authCtx.calendarCtx);
	if (!isOk(providerResult)) {
		const resolverError: ModelResolverError = providerResult.error;
		const status = resolverError.code === "API_KEY_NOT_FOUND" ? 400 : 500;
		return NextResponse.json(
			{ error: { code: resolverError.code, message: resolverError.message } },
			{ status },
		);
	}
	const provider: LLMProvider = providerResult.value;

	// 4. ツール群生成
	const tools: MiipaTools = createMiipaTools(authCtx.calendarCtx);

	// 5. システムプロンプト生成
	const systemPrompt = buildSystemPrompt();

	// 6. SSEストリーミングレスポンスを構築
	const { readable, writable } = new TransformStream<Uint8Array>();
	const writer = writable.getWriter();
	const encoder = new TextEncoder();

	// 非同期でツール呼び出しループ + ストリーミングを実行
	const processChat = async () => {
		try {
			// ツール呼び出しループ（非ストリーミング）
			const finalText = await runToolCallLoop(
				provider,
				messages,
				tools,
				systemPrompt,
				writer,
				encoder,
			);

			if (finalText !== null) {
				// 最終テキストをSSEで送信
				await writer.write(
					encoder.encode(formatSSE({ type: "text", text: finalText })),
				);

				// メッセージをD1に保存
				const dbSaveResult = getD1Database();
				if (isOk(dbSaveResult)) {
					const db = dbSaveResult.value;
					const userId = authCtx.session.user.id;
					const lastUserMessage = messages[messages.length - 1];

					try {
						// 最後のメッセージがuserロールであることを確認（不正なroleの保存を防止）
						if (lastUserMessage.role !== "user") {
							console.warn(
								"最後のメッセージがuserロールではありません:",
								lastUserMessage.role,
							);
						} else {
							// ユーザーメッセージ保存
							await db
								.prepare(
									"INSERT INTO chat_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
								)
								.bind(
									crypto.randomUUID(),
									userId,
									lastUserMessage.role,
									lastUserMessage.content,
								)
								.run();
						}

						// アシスタント応答保存
						await db
							.prepare(
								"INSERT INTO chat_messages (id, user_id, role, content, created_at) VALUES (?, ?, ?, ?, datetime('now'))",
							)
							.bind(crypto.randomUUID(), userId, "assistant", finalText)
							.run();
					} catch {
						// メッセージ保存が失敗してもチャット応答には影響させない
					}
				}
			}

			// 完了イベント送信
			await writer.write(encoder.encode(formatSSE({ type: "done" })));
		} catch (error) {
			// 内部エラー詳細はクライアントに返さない（OWASP A01:2021 - 情報漏洩防止）
			console.error("チャット処理エラー:", error);
			await writer.write(
				encoder.encode(
					formatSSE({
						type: "error",
						error: "応答の生成中にエラーが発生しました",
					}),
				),
			);
		} finally {
			await writer.close();
		}
	};

	// バックグラウンドで処理開始（unhandled rejection防止）
	processChat().catch((error) => {
		console.error("チャットストリーム処理の致命的エラー:", error);
	});

	return new Response(readable, {
		headers: createSSEHeaders(),
	});
}

// ============================================================
// GET: 会話履歴取得
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

/** 取得する会話履歴の最大件数 */
const MAX_HISTORY_COUNT = 50;

/**
 * 会話履歴を取得
 *
 * @returns 会話履歴のJSON配列
 */
export async function GET(): Promise<NextResponse> {
	// 1. 認証チェック
	const authResult = await createAuthenticatedContext();
	if (!isOk(authResult)) {
		return NextResponse.json(
			{
				error: {
					code: authResult.error.code,
					message: authResult.error.message,
				},
			},
			{ status: authResult.error.status },
		);
	}
	const authCtx: AuthenticatedContext = authResult.value;
	const userId = authCtx.session.user.id;

	// 2. D1データベース取得
	const dbResult = getD1Database();
	if (!isOk(dbResult)) {
		return NextResponse.json(
			{ error: { code: "DB_ERROR", message: "データベース接続エラー" } },
			{ status: 500 },
		);
	}
	const db = dbResult.value;

	// 3. 会話履歴を取得（最新50件、古い順）
	try {
		const result = await db
			.prepare(
				`SELECT id, user_id, role, content, tool_calls, created_at
				FROM chat_messages
				WHERE user_id = ?
				ORDER BY created_at DESC
				LIMIT ?`,
			)
			.bind(userId, MAX_HISTORY_COUNT)
			.all<ChatMessageRecord>();

		const messages: ChatHistoryResponse[] = result.results
			.reverse()
			.map((record) => ({
				id: record.id,
				role: record.role,
				content: record.content,
				toolCalls: record.tool_calls
					? (JSON.parse(record.tool_calls) as ToolCall[])
					: null,
				createdAt: record.created_at,
			}));

		return NextResponse.json({ messages });
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "会話履歴の取得に失敗しました";
		return NextResponse.json(
			{ error: { code: "DB_ERROR", message: errorMessage } },
			{ status: 500 },
		);
	}
}
