import { useCallback, useState } from "react";
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
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

function ExpandIcon() {
	return (
		<Svg width={20} height={20} viewBox="0 0 20 20" fill="currentColor">
			<Path
				fillRule="evenodd"
				d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
				clipRule="evenodd"
			/>
		</Svg>
	);
}

function CollapseIcon() {
	return (
		<Svg width={20} height={20} viewBox="0 0 20 20" fill="currentColor">
			<Path
				fillRule="evenodd"
				d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
				clipRule="evenodd"
			/>
		</Svg>
	);
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
 * Web: 画面下部にフローティング表示、Mobile: フルスクリーン
 */
export function ChatPanel({
	messages,
	input,
	setInput,
	sendMessage,
	isLoading,
	error,
}: ChatPanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [sendKey, setSendKey] = useState<SendKeyType>("enter");

	const handleSuggestionSelect = useCallback(
		(suggestion: string) => {
			setIsExpanded(true);
			sendMessage(suggestion);
		},
		[sendMessage],
	);

	const handleSend = useCallback(() => {
		if (!isExpanded) {
			setIsExpanded(true);
		}
		Keyboard.dismiss();
		sendMessage();
	}, [isExpanded, sendMessage]);

	const toggleExpanded = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	const toggleSendKey = useCallback(() => {
		setSendKey((prev) => (prev === "enter" ? "cmd+enter" : "enter"));
	}, []);

	const hasMessages = messages.length > 0;

	// Web: フローティングパネル
	if (Platform.OS === "web") {
		return (
			<View
				className={`border-t border-border bg-bg shadow-lg ${
					isExpanded ? "max-h-[70vh]" : ""
				}`}
				style={
					Platform.OS === "web"
						? ({
								position: "fixed" as unknown as undefined,
								bottom: 0,
								left: 0,
								right: 0,
								zIndex: 50,
							} as Record<string, unknown>)
						: undefined
				}
				accessibilityLabel="チャットパネル"
			>
				{/* パネルヘッダー */}
				<View className="flex-row items-center justify-between border-b border-border bg-bg px-4 py-1">
					<Text className="text-xs font-medium text-fg-muted">miipa AI</Text>
					<Pressable
						onPress={toggleExpanded}
						accessibilityLabel={
							isExpanded ? "チャットを閉じる" : "チャットを開く"
						}
						accessibilityRole="button"
						className="h-11 w-11 items-center justify-center rounded-lg"
					>
						{isExpanded ? <CollapseIcon /> : <ExpandIcon />}
					</Pressable>
				</View>

				{/* 展開時: メッセージ履歴エリア */}
				{isExpanded && (
					<View className="flex-1 gap-3 overflow-auto py-4">
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
					</View>
				)}

				{/* 入力エリア（常時表示） */}
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
				contentContainerClassName="gap-3 py-4"
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
