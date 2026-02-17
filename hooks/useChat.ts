"use client";

/**
 * チャットフック
 *
 * SSEストリーミング対応のカスタムチャットフックです。
 * AIアシスタントとのリアルタイムな会話を実現します。
 *
 * @module hooks/useChat
 *
 * @example
 * ```tsx
 * const { messages, input, setInput, sendMessage, isLoading, error, messagesEndRef } = useChat();
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// 型定義
// ============================================================

/**
 * チャットメッセージの型
 */
export interface ChatMessage {
	/** メッセージID */
	id: string;
	/** メッセージの送信者ロール */
	role: "user" | "assistant";
	/** メッセージ本文 */
	content: string;
	/** 作成日時（ISO 8601形式） */
	createdAt: string;
}

/**
 * SSEストリームイベントの型
 */
interface StreamEvent {
	/** イベント種別 */
	type: "text" | "tool_call" | "done" | "error";
	/** テキストデータ（text時のみ） */
	text?: string;
	/** エラーメッセージ（error時のみ） */
	error?: string;
	/** ツール呼び出し情報（tool_call時のみ） */
	toolCall?: { id: string; name: string; arguments: Record<string, unknown> };
}

/**
 * チャット履歴APIレスポンスの型
 */
interface ChatHistoryResponse {
	messages: ChatMessage[];
}

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
	/** メッセージ末尾への参照（自動スクロール用） */
	messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

// ============================================================
// ヘルパー関数
// ============================================================

/**
 * ユニークIDを生成する
 *
 * @returns ランダムなID文字列
 */
function generateId(): string {
	return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * SSEストリームの1行を解析する
 *
 * @param line - SSEデータ行（"data: ..." 形式）
 * @returns 解析されたStreamEvent、または解析不能の場合はnull
 */
function parseSSELine(line: string): StreamEvent | null {
	const trimmed = line.trim();
	if (!trimmed.startsWith("data: ")) {
		return null;
	}

	const jsonStr = trimmed.slice(6);
	if (!jsonStr || jsonStr === "[DONE]") {
		return { type: "done" };
	}

	try {
		return JSON.parse(jsonStr) as StreamEvent;
	} catch {
		return null;
	}
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
 * @returns チャット状態と操作関数
 */
export function useChat(): UseChatReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	/**
	 * メッセージ末尾へ自動スクロール
	 */
	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	/**
	 * 初回マウント時にチャット履歴を読み込む
	 */
	useEffect(() => {
		async function loadHistory() {
			try {
				const response = await fetch("/api/chat");
				if (response.ok) {
					const data: ChatHistoryResponse = await response.json();
					if (data.messages && data.messages.length > 0) {
						setMessages(data.messages);
					}
				}
			} catch {
				// 履歴の読み込みに失敗しても、新規会話は可能
			}
		}

		loadHistory();
	}, []);

	/**
	 * メッセージ更新時に自動スクロール
	 * messages はトリガーとして意図的に依存に含めている
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: messages はメッセージ追加時のスクロールトリガー
	useEffect(() => {
		scrollToBottom();
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

				const response = await fetch("/api/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						messages: allMessages.map((m) => ({
							role: m.role,
							content: m.content,
						})),
					}),
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(errorText || "メッセージの送信に失敗しました");
				}

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
					err instanceof Error ? err.message : "メッセージの送信に失敗しました";
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
		messagesEndRef,
	};
}
