import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList } from "react-native";
import type { ChatMessage, StreamEvent } from "../api/chat";
import { fetchChatHistory, parseSSELine, sendChatMessage } from "../api/chat";

// ============================================================
// 型定義（再エクスポート用）
// ============================================================

export type { ChatMessage };

/**
 * useChatフックの戻り値型
 */
export interface UseChatReturn {
	/** メッセージ一覧 */
	messages: ChatMessage[];
	/** 入力テキスト */
	input: string;
	/** 入力テキストの更新関数 */
	setInput: (input: string) => void;
	/** メッセージ送信関数 */
	sendMessage: (overrideInput?: string) => Promise<void>;
	/** ローディング状態 */
	isLoading: boolean;
	/** エラー情報 */
	error: string | null;
	/** FlatList への参照（自動スクロール用） */
	flatListRef: React.RefObject<FlatList | null>;
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * ユニークIDを生成する
 */
function generateId(): string {
	return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================
// メインフック
// ============================================================

/**
 * チャットフック
 *
 * SSEストリーミングを使用してAIアシスタントとリアルタイムに会話するためのフックです。
 * 初回マウント時にチャット履歴を読み込み、メッセージの送受信を管理します。
 *
 * Web の useChat を移植し、スクロール制御を FlatList ベースに変更しています。
 */
export function useChat(): UseChatReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const flatListRef = useRef<FlatList>(null);

	/**
	 * メッセージ末尾へ自動スクロール
	 */
	const scrollToBottom = useCallback(() => {
		flatListRef.current?.scrollToEnd({ animated: true });
	}, []);

	/**
	 * 初回マウント時にチャット履歴を読み込む
	 */
	useEffect(() => {
		async function loadHistory() {
			try {
				const data = await fetchChatHistory();
				if (data.messages && data.messages.length > 0) {
					setMessages(data.messages);
				}
			} catch {
				// 履歴の読み込みに失敗しても、新規会話は可能
			}
		}

		loadHistory();
	}, []);

	/**
	 * メッセージ更新時に自動スクロール
	 */
	useEffect(() => {
		// メッセージ変更後に少し遅延を入れてスクロール
		// （FlatList のレンダリングが完了するのを待つ）
		const timer = setTimeout(scrollToBottom, 100);
		return () => clearTimeout(timer);
	}, [messages, scrollToBottom]);

	/**
	 * メッセージを送信し、SSEストリームからレスポンスを受信する
	 */
	const sendMessage = useCallback(
		async (overrideInput?: string) => {
			const trimmedInput = (overrideInput ?? input).trim();
			if (!trimmedInput || isLoading) {
				return;
			}

			// エラーをリセット
			setError(null);

			// ユーザーメッセージを追加
			const userMessage: ChatMessage = {
				id: generateId(),
				role: "user",
				content: trimmedInput,
				createdAt: new Date().toISOString(),
			};

			// アシスタントの空メッセージを追加（ストリーミング受信用）
			const assistantMessageId = generateId();
			const assistantMessage: ChatMessage = {
				id: assistantMessageId,
				role: "assistant",
				content: "",
				createdAt: new Date().toISOString(),
			};

			setMessages((prev) => [...prev, userMessage, assistantMessage]);
			setInput("");
			setIsLoading(true);

			try {
				// 全メッセージ（新しいユーザーメッセージを含む）をAPIに送信
				const allMessages = [...messages, userMessage];

				const response = await sendChatMessage(
					allMessages.map((m) => ({
						role: m.role,
						content: m.content,
					})),
				);

				if (!response.body) {
					throw new Error("レスポンスストリームが利用できません");
				}

				// SSEストリームを読み取る
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) {
						break;
					}

					buffer += decoder.decode(value, { stream: true });

					// バッファを行単位で処理
					const lines = buffer.split("\n");
					// 最後の不完全な行はバッファに残す
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						const event = parseSSELine(line);
						if (!event) {
							continue;
						}

						switch (event.type) {
							case "text":
								// アシスタントメッセージにテキストを追加
								if (event.text) {
									setMessages((prev) =>
										prev.map((m) =>
											m.id === assistantMessageId
												? { ...m, content: m.content + event.text }
												: m,
										),
									);
								}
								break;

							case "tool_call":
								// ツール呼び出し中の表示（将来的な拡張用）
								break;

							case "done":
								setIsLoading(false);
								break;

							case "error":
								setError(event.error ?? "不明なエラーが発生しました");
								setIsLoading(false);
								break;
						}
					}
				}

				// ストリーム完了後にisLoadingを確実にfalseにする
				setIsLoading(false);
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "メッセージの送信に失敗しました";
				setError(message);
				setIsLoading(false);
			}
		},
		[input, isLoading, messages],
	);

	return {
		messages,
		input,
		setInput,
		sendMessage,
		isLoading,
		error,
		flatListRef,
	};
}
