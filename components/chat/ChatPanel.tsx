"use client";

/**
 * ChatPanelコンポーネント
 *
 * メインチャットパネルです。フローティングパネル方式で画面下部に表示されます。
 * 折りたたみ時は入力バーのみ、展開時はメッセージ履歴と入力エリアを表示します。
 *
 * @module components/chat/ChatPanel
 */

import { useCallback, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { css } from "@/styled-system/css";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 展開アイコン（上矢印のSVG）
 */
function ExpandIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({
				width: "5",
				height: "5",
			})}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * 閉じるアイコン（下矢印のSVG）
 */
function CollapseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 20 20"
			fill="currentColor"
			className={css({
				width: "5",
				height: "5",
			})}
			aria-hidden="true"
		>
			<path
				fillRule="evenodd"
				d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

/**
 * バウンスドットローディングインジケーター
 *
 * AIが応答を生成中であることを示すアニメーションです。
 */
function LoadingDots() {
	return (
		<output
			className={css({
				display: "flex",
				justifyContent: "flex-start",
				px: "2",
				pl: "9",
			})}
			aria-label="応答を生成中"
		>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "1",
					px: "4",
					py: "3",
					borderRadius: "xl",
					borderBottomLeftRadius: "sm",
					bg: "bg.subtle",
				})}
			>
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className={css({
							width: "2",
							height: "2",
							borderRadius: "full",
							bg: "fg.muted",
							animation: "pulse 1.4s ease-in-out infinite",
						})}
						style={{
							animationDelay: `${i * 0.2}s`,
						}}
					/>
				))}
			</div>
		</output>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * フローティングチャットパネル
 *
 * 画面下部にフローティング表示されるチャットUIです。
 * - 折りたたみ時: 入力バーのみ表示
 * - 展開時: メッセージ履歴 + 質問候補 + 入力エリア
 *
 * @returns チャットパネル要素
 */
export function ChatPanel() {
	const {
		messages,
		input,
		setInput,
		sendMessage,
		isLoading,
		error,
		messagesEndRef,
	} = useChat();

	const [isExpanded, setIsExpanded] = useState(false);

	/**
	 * 質問候補選択時のハンドラ
	 *
	 * パネルを展開状態にしてメッセージを送信する
	 */
	const handleSuggestionSelect = useCallback(
		(suggestion: string) => {
			setIsExpanded(true);
			sendMessage(suggestion);
		},
		[sendMessage],
	);

	/**
	 * 送信時にパネルを展開する
	 */
	const handleSend = useCallback(() => {
		if (!isExpanded) {
			setIsExpanded(true);
		}
		sendMessage();
	}, [isExpanded, sendMessage]);

	/**
	 * パネルの展開/折りたたみ切り替え
	 */
	const toggleExpanded = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	const hasMessages = messages.length > 0;

	return (
		<section
			className={css({
				position: "fixed",
				bottom: "0",
				left: "0",
				right: "0",
				zIndex: 50,
				display: "flex",
				flexDirection: "column",
				maxHeight: isExpanded ? "70vh" : "auto",
				bg: "bg.default",
				borderTop: "1px solid",
				borderColor: "border.default",
				boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.1)",
				transition: "max-height 0.3s ease",
			})}
			aria-label="チャットパネル"
		>
			{/* パネルヘッダー（展開/折りたたみトグル） */}
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					px: "4",
					py: "1",
					borderBottom: isExpanded ? "1px solid" : "none",
					borderColor: "border.default",
					bg: "bg.default",
				})}
			>
				<span
					className={css({
						fontSize: "xs",
						fontWeight: "medium",
						color: "fg.muted",
					})}
				>
					miipa AI
				</span>

				<button
					type="button"
					onClick={toggleExpanded}
					aria-label={isExpanded ? "チャットを閉じる" : "チャットを開く"}
					aria-expanded={isExpanded}
					className={css({
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						// WCAG: タッチターゲット44px以上
						width: "11",
						height: "11",
						borderRadius: "lg",
						color: "fg.muted",
						bg: "transparent",
						border: "none",
						cursor: "pointer",
						transition: "all 0.2s ease",
						_hover: {
							color: "fg.default",
							bg: "bg.subtle",
						},
						_focusVisible: {
							outline: "3px solid",
							outlineColor: "neutral.9",
							outlineOffset: "2px",
						},
					})}
				>
					{isExpanded ? <CollapseIcon /> : <ExpandIcon />}
				</button>
			</div>

			{/* 展開時: メッセージ履歴エリア */}
			{isExpanded && (
				<div
					className={css({
						flex: 1,
						overflow: "auto",
						py: "4",
						display: "flex",
						flexDirection: "column",
						gap: "3",
					})}
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
						<div
							className={css({
								mx: "4",
								px: "3",
								py: "2",
								borderRadius: "lg",
								bg: "red.2",
								color: "red.11",
								fontSize: "sm",
								border: "1px solid",
								borderColor: "red.6",
							})}
							role="alert"
						>
							{error}
						</div>
					)}

					{/* 自動スクロール用のアンカー */}
					<div ref={messagesEndRef} />
				</div>
			)}

			{/* 入力エリア（常時表示） */}
			<ChatInput
				value={input}
				onChange={setInput}
				onSend={handleSend}
				isLoading={isLoading}
			/>
		</section>
	);
}
