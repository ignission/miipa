/**
 * チャット画面
 *
 * AIアシスタントとの対話画面です。
 * ChatPanelコンポーネントを使用してメッセージの送受信を行います。
 *
 * @module app/(auth)/chat
 */

import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { apiFetch } from "../../src/api/client";
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

export default function ChatScreen() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * メッセージ送信ハンドラ
	 *
	 * ユーザーメッセージを追加し、バックエンドAPIにリクエストを送信します。
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
				const data = await apiFetch<{
					message?: string;
					answer?: string;
				}>("/api/ask", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: messageText.trim(),
					}),
				});

				const assistantContent =
					data.message ?? data.answer ?? "応答を取得できませんでした";

				const assistantMessage: Message = {
					id: `assistant-${Date.now()}`,
					role: "assistant",
					content: assistantContent,
				};

				setMessages((prev) => [...prev, assistantMessage]);
			} catch (e) {
				setError(e instanceof Error ? e.message : "エラーが発生しました");
			} finally {
				setIsLoading(false);
			}
		},
		[input],
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
