"use client";

/**
 * Ollama接続確認コンポーネント
 *
 * Ollamaサーバーへの接続確認とモデル一覧の取得を行うコンポーネントです。
 * APIキーは不要で、サーバーURLのみで接続できます。
 *
 * @module components/setup/OllamaConnector
 *
 * @example
 * ```tsx
 * <OllamaConnector
 *   onConnected={() => console.log('接続成功')}
 *   defaultUrl="http://localhost:11434"
 * />
 * ```
 */

import Image from "next/image";
import { useState } from "react";
import { css } from "@/styled-system/css";

/**
 * OllamaConnectorコンポーネントのProps
 */
interface OllamaConnectorProps {
	/** 接続成功時のコールバック */
	onConnected: () => void;
	/** デフォルトURL（省略時: http://localhost:11434） */
	defaultUrl?: string;
}

/**
 * 接続状態
 * - idle: 初期状態
 * - connecting: 接続中
 * - connected: 接続成功
 * - error: エラー
 */
type Status = "idle" | "connecting" | "connected" | "error";

/**
 * 接続結果の型
 */
interface ConnectionResult {
	valid: boolean;
	models?: string[];
	error?: { code: string; message: string };
}

/**
 * Ollama接続確認コンポーネント
 *
 * Ollamaサーバーへの接続を確認し、利用可能なモデル一覧を表示します。
 * 接続成功時にonConnectedコールバックが呼び出されます。
 *
 * @param props - コンポーネントのProps
 * @param props.onConnected - 接続成功時のコールバック
 * @param props.defaultUrl - デフォルトのサーバーURL
 * @returns Ollama接続確認フォーム要素
 */
export function OllamaConnector({
	onConnected,
	defaultUrl = "http://localhost:11434",
}: OllamaConnectorProps) {
	const [url, setUrl] = useState(defaultUrl);
	const [status, setStatus] = useState<Status>("idle");
	const [availableModels, setAvailableModels] = useState<string[]>([]);
	const [errorMessage, setErrorMessage] = useState<string>("");

	/**
	 * 接続確認を実行
	 */
	const handleConnect = async () => {
		setStatus("connecting");
		setErrorMessage("");

		try {
			const response = await fetch("/api/setup/validate-key", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider: "ollama", apiKey: url }),
			});

			const result: ConnectionResult = await response.json();

			if (result.valid) {
				setStatus("connected");
				setAvailableModels(result.models || []);
				onConnected();
			} else {
				setStatus("error");
				setErrorMessage(result.error?.message || "接続に失敗しました");
			}
		} catch {
			setStatus("error");
			setErrorMessage("ネットワークエラーが発生しました");
		}
	};

	return (
		<div
			className={css({ display: "flex", flexDirection: "column", gap: "4" })}
		>
			{/* Ollama情報 */}
			<div className={css({ display: "flex", alignItems: "center", gap: "3" })}>
				<Image
					src="/icons/ollama.svg"
					alt="Ollama"
					width={32}
					height={32}
					className={css({ width: "8", height: "8" })}
				/>
				<span className={css({ fontWeight: "semibold", fontSize: "lg" })}>
					Ollama
				</span>
			</div>

			<p className={css({ color: "fg.muted", fontSize: "sm" })}>
				Ollamaサーバーに接続します。APIキーは不要です。
			</p>

			{/* URL入力 */}
			<div
				className={css({ display: "flex", flexDirection: "column", gap: "2" })}
			>
				<label htmlFor="ollama-url" className={css({ fontWeight: "medium" })}>
					サーバーURL
				</label>
				<input
					id="ollama-url"
					type="url"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="http://localhost:11434"
					className={css({
						width: "full",
						p: "3",
						border: "1px solid",
						borderColor: "border.default",
						borderRadius: "md",
						_focus: {
							outline: "2px solid",
							outlineColor: "accent.default",
							outlineOffset: "2px",
						},
					})}
				/>
			</div>

			{/* 接続確認ボタン */}
			<button
				type="button"
				onClick={handleConnect}
				disabled={status === "connecting"}
				className={css({
					p: "3",
					bg: "accent.default",
					color: "accent.fg",
					borderRadius: "md",
					fontWeight: "medium",
					cursor: "pointer",
					_disabled: { opacity: 0.5, cursor: "not-allowed" },
					_hover: { bg: "accent.emphasized" },
				})}
			>
				{status === "connecting" ? "接続中..." : "接続確認"}
			</button>

			{/* 接続成功 */}
			{status === "connected" && (
				<div
					className={css({
						p: "3",
						borderRadius: "md",
						bg: "green.100",
						color: "green.800",
					})}
					role="alert"
				>
					<p className={css({ fontWeight: "medium", mb: "2" })}>
						接続に成功しました
					</p>
					{availableModels.length > 0 && (
						<div>
							<p className={css({ fontSize: "sm", mb: "1" })}>
								利用可能なモデル:
							</p>
							<ul
								className={css({ fontSize: "sm", pl: "4", listStyle: "disc" })}
							>
								{availableModels.slice(0, 5).map((model) => (
									<li key={model}>{model}</li>
								))}
								{availableModels.length > 5 && (
									<li>他 {availableModels.length - 5} モデル</li>
								)}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* エラー */}
			{status === "error" && (
				<div
					className={css({
						p: "3",
						borderRadius: "md",
						bg: "red.100",
						color: "red.800",
					})}
					role="alert"
				>
					<p className={css({ fontWeight: "medium", mb: "2" })}>
						接続に失敗しました
					</p>
					<p className={css({ fontSize: "sm" })}>{errorMessage}</p>
					<p className={css({ fontSize: "sm", mt: "2", color: "red.600" })}>
						Ollamaが起動していない場合は <code>ollama serve</code>{" "}
						を実行してください
					</p>
				</div>
			)}
		</div>
	);
}
