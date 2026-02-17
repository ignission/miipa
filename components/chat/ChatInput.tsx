"use client";

/**
 * ChatInputコンポーネント
 *
 * チャットメッセージの入力と送信を行うコンポーネントです。
 * テキストエリアの自動リサイズ、Enter送信、Shift+Enter改行に対応しています。
 *
 * @module components/chat/ChatInput
 */

import { type KeyboardEvent, useCallback, useEffect, useRef } from "react";
import type { SendKeyType } from "@/hooks/useSendKeySetting";
import { css } from "@/styled-system/css";

// ============================================================
// 型定義
// ============================================================

/**
 * ChatInputコンポーネントのProps
 */
interface ChatInputProps {
	/** 入力テキスト */
	value: string;
	/** 入力テキスト変更ハンドラ */
	onChange: (value: string) => void;
	/** 送信ハンドラ */
	onSend: () => void;
	/** ローディング状態 */
	isLoading: boolean;
	/** 送信キー設定 */
	sendKey: SendKeyType;
	/** 送信キー切替ハンドラ */
	onToggleSendKey: () => void;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 送信アイコン（矢印のSVG）
 */
function SendIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="currentColor"
			className={css({
				width: "5",
				height: "5",
			})}
			aria-hidden="true"
		>
			<path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
		</svg>
	);
}

// ============================================================
// 定数
// ============================================================

/**
 * テキストエリアの最大高さ（行数制限用）
 */
const MAX_TEXTAREA_HEIGHT = 160;

/**
 * テキストエリアの最小高さ
 */
const MIN_TEXTAREA_HEIGHT = 44;

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * チャット入力コンポーネント
 *
 * テキストエリアと送信ボタンを含む入力フォームです。
 * - Enter: メッセージ送信
 * - Shift+Enter: 改行
 * - テキストエリアは入力に応じて自動リサイズ
 * - WCAG: タッチターゲット44px以上
 *
 * @param props - コンポーネントのProps
 * @returns 入力フォーム要素
 */
export function ChatInput({
	value,
	onChange,
	onSend,
	isLoading,
	sendKey,
	onToggleSendKey,
}: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	/**
	 * テキストエリアの高さを内容に応じて自動調整する
	 */
	const adjustHeight = useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea) {
			return;
		}

		// 一度高さをリセットしてscrollHeightを正確に取得
		textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
		const scrollHeight = textarea.scrollHeight;
		textarea.style.height = `${Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
	}, []);

	/**
	 * 値が変更されたときに高さを調整
	 * value を依存に含めることで、テキスト変更時に高さを再計算する
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: value はトリガーとして意図的に依存に含めている
	useEffect(() => {
		adjustHeight();
	}, [value, adjustHeight]);

	/**
	 * キーボードイベントハンドラ
	 *
	 * sendKey === "enter": Enter送信 / Shift+Enter改行
	 * sendKey === "cmd-enter": Cmd+Enter(Mac) or Ctrl+Enter(Win)送信 / Enter改行
	 */
	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLTextAreaElement>) => {
			if (sendKey === "enter") {
				// Enterモード: Enter送信 / Shift+Enter改行
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					if (!isLoading && value.trim()) {
						onSend();
					}
				}
			} else {
				// Cmd+Enterモード: Cmd+Enter(Mac) or Ctrl+Enter(Win)送信 / Enter改行
				if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
					e.preventDefault();
					if (!isLoading && value.trim()) {
						onSend();
					}
				}
			}
		},
		[sendKey, isLoading, value, onSend],
	);

	const canSend = !isLoading && value.trim().length > 0;

	return (
		<div
			className={css({
				display: "flex",
				alignItems: "flex-end",
				gap: "2",
				px: "3",
				py: "2",
				bg: "bg.default",
				borderTop: "1px solid",
				borderColor: "border.default",
			})}
		>
			{/* テキストエリア */}
			<textarea
				ref={textareaRef}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="miipa に質問する..."
				rows={1}
				disabled={isLoading}
				aria-label="メッセージ入力"
				className={css({
					flex: 1,
					minHeight: "11",
					maxHeight: "40",
					py: "2.5",
					px: "3",
					bg: "bg.subtle",
					color: "fg.default",
					border: "1px solid",
					borderColor: "border.default",
					borderRadius: "xl",
					fontSize: "sm",
					lineHeight: "relaxed",
					resize: "none",
					outline: "none",
					transition: "border-color 0.2s ease",
					_placeholder: {
						color: "fg.muted",
					},
					_focusVisible: {
						borderColor: "neutral.9",
						boxShadow: "0 0 0 1px token(colors.neutral.9)",
					},
					_disabled: {
						opacity: 0.6,
						cursor: "not-allowed",
					},
				})}
			/>

			{/* 送信キー切替ボタン */}
			<button
				type="button"
				onClick={onToggleSendKey}
				title={
					sendKey === "enter"
						? "Enter で送信 / Shift+Enter で改行"
						: "⌘+Enter で送信 / Enter で改行"
				}
				aria-label={`送信キー: ${sendKey === "enter" ? "Enter" : "⌘+Enter"}`}
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					height: "11",
					px: "2",
					flexShrink: 0,
					borderRadius: "lg",
					bg: "transparent",
					color: "fg.muted",
					border: "1px solid",
					borderColor: "border.default",
					cursor: "pointer",
					fontSize: "xs",
					fontFamily: "mono",
					whiteSpace: "nowrap",
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
				{sendKey === "enter" ? "↵" : "⌘↵"}
			</button>

			{/* 送信ボタン */}
			<button
				type="button"
				onClick={onSend}
				disabled={!canSend}
				aria-label="メッセージを送信"
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					// WCAG: タッチターゲット44px以上
					width: "11",
					height: "11",
					flexShrink: 0,
					borderRadius: "full",
					bg: canSend ? "neutral.9" : "bg.muted",
					color: canSend ? "white" : "fg.muted",
					border: "none",
					cursor: canSend ? "pointer" : "not-allowed",
					transition: "all 0.2s ease",
					_hover: canSend
						? {
								opacity: 0.85,
							}
						: {},
					_focusVisible: {
						outline: "3px solid",
						outlineColor: "neutral.9",
						outlineOffset: "2px",
					},
					_active: canSend
						? {
								transform: "scale(0.95)",
							}
						: {},
				})}
			>
				<SendIcon />
			</button>
		</div>
	);
}
