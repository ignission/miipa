/**
 * チャット画面
 *
 * AIアシスタントとの対話画面です。
 * ChatPanelコンポーネントを使用してメッセージの送受信を行います。
 * バックエンドの /chat エンドポイントに SSE でリクエストを送信し、
 * ストリーミングレスポンスを処理します。
 *
 * @module app/(auth)/chat
 */

import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, View } from "react-native";
import { AUTH_CONFIG } from "../../src/auth/config";
import { getToken } from "../../src/auth/storage";
import { ChatPanel } from "../../src/components/chat/chat-panel";

// ============================================================
// 型定義
// ============================================================

/** チャットメッセージの型 */
interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
}

/** SSEイベントの型 */
type SSEEvent =
	| { type: "tool_call"; toolCall: unknown }
	| { type: "text"; text: string }
	| { type: "done" }
	| { type: "error"; error: string };

// ============================================================
// SSE パーサー
// ============================================================

/**
 * SSE レスポンスのストリームを読み取り、イベントを処理するコールバックに渡す
 *
 * @param reader ReadableStream のリーダー
 * @param onEvent SSE イベントごとのコールバック
 */
async function readSSEStream(
	reader: ReadableStreamDefaultReader<Uint8Array>,
	onEvent: (event: SSEEvent) => void,
): Promise<void> {
	const decoder = new TextDecoder();
	let buffer = "";

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });

		// SSE は改行区切りで行を処理
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";

		for (const line of lines) {
			if (!line.startsWith("data: ")) continue;
			const json = line.slice(6);
			try {
				const event = JSON.parse(json) as SSEEvent;
				onEvent(event);
			} catch {
				// JSON パース失敗は無視
			}
		}
	}
}

export default function ChatScreen() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * メッセージ送信ハンドラ
	 *
	 * ユーザーメッセージを追加し、バックエンドの /chat に SSE リクエストを送信します。
	 * 会話履歴全体を messages 配列として送信します。
	 */
	const sendMessage = useCallback(
		async (text?: string) => {
			const messageText = text ?? input;
			if (!messageText.trim()) return;

			const userMessage: Message = {
				id: `user-${Date.now()}`,
				role: "user",
				content: messageText.trim(),
			};

			setMessages((prev) => [...prev, userMessage]);
			setInput("");
			setIsLoading(true);
			setError(null);

			try {
				// 認証トークンを取得
				const token = await getToken();
				const apiBaseUrl = AUTH_CONFIG.apiBaseUrl;

				// 会話履歴を構築（id を除外して role と content のみ送信）
				const chatMessages = [
					...messages,
					{ role: userMessage.role, content: userMessage.content },
				].map((m) => ({ role: m.role, content: m.content }));

				// fetch オプション構築（Web は credentials: "include" を追加）
				const fetchOptions: RequestInit = {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(token ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: JSON.stringify({ messages: chatMessages }),
					...(Platform.OS === "web" ? { credentials: "include" as const } : {}),
				};

				const response = await fetch(`${apiBaseUrl}/chat`, fetchOptions);

				if (!response.ok) {
					const body = await response.json().catch(() => null);
					const message =
						(body as { error?: string })?.error ??
						`API エラー: ${response.status}`;
					throw new Error(message);
				}

				const reader = response.body?.getReader();
				if (!reader) {
					throw new Error("レスポンスストリームを取得できませんでした");
				}

				// SSE ストリームを読み取り、テキストイベントからアシスタント応答を収集
				let assistantContent = "";

				await readSSEStream(reader, (event) => {
					if (event.type === "text") {
						assistantContent += event.text;
					} else if (event.type === "error") {
						throw new Error(event.error);
					}
					// tool_call, done は無視
				});

				if (assistantContent) {
					const assistantMessage: Message = {
						id: `assistant-${Date.now()}`,
						role: "assistant",
						content: assistantContent,
					};
					setMessages((prev) => [...prev, assistantMessage]);
				} else {
					setError("応答を取得できませんでした");
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : "エラーが発生しました");
			} finally {
				setIsLoading(false);
			}
		},
		[input, messages],
	);

	return (
		<>
			<Stack.Screen options={{ title: "miipa AI" }} />
			<View className="flex-1 bg-bg-canvas">
				<ChatPanel
					messages={messages}
					input={input}
					setInput={setInput}
					sendMessage={sendMessage}
					isLoading={isLoading}
					error={error}
				/>
			</View>
		</>
	);
}
