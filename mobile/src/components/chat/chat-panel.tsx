import { useCallback, useState } from "react";
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import type { SendKeyType } from "../../api/settings";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { ChatSuggestions } from "./chat-suggestions";

interface Message {
	/** メッセージID */
	id: string;
	/** 送信者ロール */
	role: "user" | "assistant";
	/** メッセージ本文 */
	content: string;
}

interface ChatPanelProps {
	/** メッセージ一覧 */
	messages: Message[];
	/** 入力テキスト */
	input: string;
	/** 入力テキスト変更ハンドラ */
	setInput: (value: string) => void;
	/** メッセージ送信ハンドラ */
	sendMessage: (text?: string) => void;
	/** ローディング状態 */
	isLoading: boolean;
	/** エラーメッセージ */
	error: string | null;
}

/** AI応答中のローディングインジケーター */
function LoadingDots() {
	return (
		<View
			className="flex-row justify-start px-2 pl-9"
			accessibilityLabel="応答を生成中"
		>
			<View className="flex-row items-center gap-1 rounded-xl rounded-bl-sm bg-bg-subtle px-4 py-3">
				{[0, 1, 2].map((i) => (
					<View
						key={i}
						className="h-2 w-2 rounded-full bg-fg-muted opacity-60"
					/>
				))}
			</View>
		</View>
	);
}

/**
 * チャットパネル
 *
 * Web/Mobile共にフルスクリーン表示
 */
export function ChatPanel({
	messages,
	input,
	setInput,
	sendMessage,
	isLoading,
	error,
}: ChatPanelProps) {
	const [sendKey, setSendKey] = useState<SendKeyType>("enter");

	const handleSuggestionSelect = useCallback(
		(suggestion: string) => {
			sendMessage(suggestion);
		},
		[sendMessage],
	);

	const handleSend = useCallback(() => {
		Keyboard.dismiss();
		sendMessage();
	}, [sendMessage]);

	const toggleSendKey = useCallback(() => {
		setSendKey((prev) => (prev === "enter" ? "cmd+enter" : "enter"));
	}, []);

	const hasMessages = messages.length > 0;

	// Web: フルスクリーンレイアウト
	if (Platform.OS === "web") {
		return (
			<View className="flex-1 bg-bg" accessibilityLabel="チャットパネル">
				{/* ヘッダー */}
				<View className="border-b border-border bg-bg px-4 py-3">
					<Text className="text-center text-sm font-medium text-fg-muted">
						miipa AI
					</Text>
				</View>

				{/* メッセージエリア */}
				<ScrollView
					className="flex-1"
					contentContainerStyle={{
						gap: 12,
						paddingVertical: 16,
						flexGrow: 1,
					}}
				>
					{!hasMessages && !isLoading && (
						<ChatSuggestions onSelect={handleSuggestionSelect} />
					)}
					{messages.map((message) => (
						<ChatMessage
							key={message.id}
							role={message.role}
							content={message.content}
						/>
					))}
					{isLoading && <LoadingDots />}
					{error && (
						<View
							className="mx-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2"
							accessibilityRole="alert"
						>
							<Text className="text-sm text-red-700">{error}</Text>
						</View>
					)}
				</ScrollView>

				{/* 入力エリア */}
				<ChatInput
					value={input}
					onChange={setInput}
					onSend={handleSend}
					isLoading={isLoading}
					sendKey={sendKey}
					onToggleSendKey={toggleSendKey}
				/>
			</View>
		);
	}

	// Mobile: フルスクリーン表示
	return (
		<KeyboardAvoidingView behavior="padding" className="flex-1 bg-bg">
			{/* ヘッダー */}
			<View className="border-b border-border bg-bg px-4 py-3">
				<Text className="text-center text-sm font-medium text-fg-muted">
					miipa AI
				</Text>
			</View>

			{/* メッセージエリア */}
			<ScrollView
				className="flex-1"
				contentContainerStyle={{ gap: 12, paddingVertical: 16, flexGrow: 1 }}
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="handled"
			>
				{/* 会話が空の時: 質問候補を表示 */}
				{!hasMessages && !isLoading && (
					<ChatSuggestions onSelect={handleSuggestionSelect} />
				)}

				{/* メッセージ一覧 */}
				{messages.map((message) => (
					<ChatMessage
						key={message.id}
						role={message.role}
						content={message.content}
					/>
				))}

				{/* ローディングインジケーター */}
				{isLoading && <LoadingDots />}

				{/* エラー表示 */}
				{error && (
					<View
						className="mx-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2"
						accessibilityRole="alert"
					>
						<Text className="text-sm text-red-700">{error}</Text>
					</View>
				)}
			</ScrollView>

			{/* 入力エリア */}
			<ChatInput
				value={input}
				onChange={setInput}
				onSend={handleSend}
				isLoading={isLoading}
			/>
		</KeyboardAvoidingView>
	);
}
