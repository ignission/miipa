"use client";

/**
 * iCalカレンダー追加ダイアログコンポーネント
 *
 * iCal URLを入力してカレンダーを追加するためのモーダルダイアログを提供します。
 * URL（必須）とカレンダー名（任意）を入力できます。
 *
 * @module components/calendar/AddICalDialog
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <AddICalDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => {
 *     setIsOpen(false);
 *     refetchCalendars();
 *   }}
 * />
 * ```
 */

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { useAddICalCalendar } from "@/hooks";
import { css } from "@/styled-system/css";

/**
 * AddICalDialogコンポーネントのProps
 */
interface AddICalDialogProps {
	/** ダイアログの開閉状態 */
	isOpen: boolean;
	/** ダイアログを閉じる際のコールバック */
	onClose: () => void;
	/** カレンダー追加成功時のコールバック */
	onSuccess: () => void;
}

/**
 * iCalカレンダー追加ダイアログ
 *
 * iCal形式のカレンダーURLを入力してカレンダーを追加します。
 * - URL入力（必須、バリデーション付き）
 * - カレンダー名入力（任意）
 * - キャンセル/追加ボタン
 * - バリデーションエラー表示
 *
 * @param props - コンポーネントのProps
 * @returns iCalカレンダー追加ダイアログ
 */
export function AddICalDialog({
	isOpen,
	onClose,
	onSuccess,
}: AddICalDialogProps) {
	// フォーム状態
	const [url, setUrl] = useState("");
	const [name, setName] = useState("");
	// バリデーションエラー
	const [urlError, setUrlError] = useState<string | null>(null);

	// iCalカレンダー追加フック
	const { addCalendar, isLoading, error } = useAddICalCalendar();

	/**
	 * URLのバリデーション
	 *
	 * @param value - 検証するURL
	 * @returns バリデーション成功の場合true
	 */
	const validateUrl = (value: string): boolean => {
		if (!value.trim()) {
			setUrlError("URLを入力してください");
			return false;
		}

		try {
			const parsed = new URL(value);
			if (!["http:", "https:"].includes(parsed.protocol)) {
				setUrlError("http:// または https:// で始まるURLを入力してください");
				return false;
			}
		} catch {
			setUrlError("有効なURLを入力してください");
			return false;
		}

		setUrlError(null);
		return true;
	};

	/**
	 * フォーム送信ハンドラ
	 *
	 * バリデーション後、iCalカレンダーを追加します。
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateUrl(url)) {
			return;
		}

		const result = await addCalendar(url, name.trim() || undefined);
		if (result) {
			// 成功時はフォームをリセットしてダイアログを閉じる
			setUrl("");
			setName("");
			setUrlError(null);
			onSuccess();
		}
	};

	/**
	 * ダイアログを閉じる際のハンドラ
	 *
	 * フォーム状態をリセットしてダイアログを閉じます。
	 */
	const handleClose = () => {
		setUrl("");
		setName("");
		setUrlError(null);
		onClose();
	};

	/**
	 * URL入力変更ハンドラ
	 */
	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
		// 入力中はエラーをクリア
		if (urlError) {
			setUrlError(null);
		}
	};

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content
					className={css({
						maxWidth: "md",
					})}
				>
					<Dialog.CloseTrigger />
					<Dialog.Title>iCalカレンダーを追加</Dialog.Title>
					<Dialog.Description>
						iCal形式のカレンダーURLを入力してください
					</Dialog.Description>

					<form onSubmit={handleSubmit}>
						<div
							className={css({
								display: "flex",
								flexDirection: "column",
								gap: "4",
							})}
						>
							{/* URL入力 */}
							<div
								className={css({
									display: "flex",
									flexDirection: "column",
									gap: "2",
								})}
							>
								<label
									htmlFor="ical-url"
									className={css({ fontWeight: "medium", fontSize: "sm" })}
								>
									URL
									<span className={css({ color: "red.500", ml: "1" })}>*</span>
								</label>
								<input
									id="ical-url"
									type="url"
									value={url}
									onChange={handleUrlChange}
									onBlur={() => url && validateUrl(url)}
									placeholder="https://..."
									required
									className={css({
										width: "full",
										p: "3",
										border: "1px solid",
										borderColor: urlError ? "red.500" : "border.default",
										borderRadius: "md",
										_focus: {
											outline: "2px solid",
											outlineColor: urlError ? "red.500" : "accent.default",
											outlineOffset: "2px",
										},
									})}
									aria-invalid={!!urlError}
									aria-describedby={urlError ? "url-error" : undefined}
								/>
								{urlError && (
									<p
										id="url-error"
										className={css({
											color: "red.500",
											fontSize: "sm",
										})}
										role="alert"
									>
										{urlError}
									</p>
								)}
							</div>

							{/* 名前入力 */}
							<div
								className={css({
									display: "flex",
									flexDirection: "column",
									gap: "2",
								})}
							>
								<label
									htmlFor="ical-name"
									className={css({ fontWeight: "medium", fontSize: "sm" })}
								>
									カレンダー名
									<span className={css({ color: "neutral.400", ml: "1" })}>
										（任意）
									</span>
								</label>
								<input
									id="ical-name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="カレンダー名"
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

							{/* APIエラー表示 */}
							{error && (
								<div
									className={css({
										p: "3",
										bg: "red.100",
										color: "red.800",
										borderRadius: "md",
										fontSize: "sm",
									})}
									role="alert"
								>
									{error}
								</div>
							)}

							{/* ボタン */}
							<div
								className={css({
									display: "flex",
									justifyContent: "flex-end",
									gap: "3",
									mt: "2",
								})}
							>
								<button
									type="button"
									onClick={handleClose}
									disabled={isLoading}
									className={css({
										px: "4",
										py: "2",
										bg: "transparent",
										border: "1px solid",
										borderColor: "border.default",
										borderRadius: "md",
										fontWeight: "medium",
										cursor: "pointer",
										transition: "all 0.15s ease",
										_hover: {
											bg: "neutral.50",
										},
										_disabled: {
											opacity: 0.6,
											cursor: "not-allowed",
										},
									})}
								>
									キャンセル
								</button>
								<button
									type="submit"
									disabled={isLoading || !url.trim()}
									className={css({
										px: "4",
										py: "2",
										bg: "accent.default",
										color: "accent.fg",
										borderRadius: "md",
										fontWeight: "medium",
										cursor: "pointer",
										border: "none",
										transition: "all 0.15s ease",
										_hover: {
											bg: "accent.emphasized",
										},
										_disabled: {
											opacity: 0.6,
											cursor: "not-allowed",
										},
									})}
									aria-busy={isLoading}
								>
									{isLoading ? "追加中..." : "追加"}
								</button>
							</div>
						</div>
					</form>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	);
}
