"use client";

/**
 * Dialogコンポーネント
 *
 * Ark UIのDialogコンポーネントをPark UIスタイルでラップしたコンポーネントです。
 * モーダルダイアログやカレンダー詳細表示などで使用します。
 *
 * @module components/ui/dialog
 *
 * @example
 * ```tsx
 * <Dialog.Root>
 *   <Dialog.Trigger>開く</Dialog.Trigger>
 *   <Dialog.Backdrop />
 *   <Dialog.Positioner>
 *     <Dialog.Content>
 *       <Dialog.Title>タイトル</Dialog.Title>
 *       <Dialog.Description>説明テキスト</Dialog.Description>
 *       <Dialog.CloseTrigger>閉じる</Dialog.CloseTrigger>
 *     </Dialog.Content>
 *   </Dialog.Positioner>
 * </Dialog.Root>
 * ```
 */

import { Dialog as ArkDialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import type { ComponentProps } from "react";
import { css, cx } from "@/styled-system/css";

/**
 * Dialog.Root - ダイアログルート
 *
 * すべてのダイアログコンポーネントをラップするルートコンテナです。
 */
function DialogRoot(props: ComponentProps<typeof ArkDialog.Root>) {
	return <ArkDialog.Root {...props} />;
}

/**
 * Dialog.Trigger - ダイアログトリガー
 *
 * ダイアログを開くためのトリガーボタンです。
 */
function DialogTrigger({
	className,
	...props
}: ComponentProps<typeof ArkDialog.Trigger>) {
	return (
		<ArkDialog.Trigger
			className={cx(
				css({
					cursor: "pointer",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Dialog.Backdrop - ダイアログバックドロップ
 *
 * ダイアログの背後に表示される半透明のオーバーレイです。
 */
function DialogBackdrop({
	className,
	...props
}: ComponentProps<typeof ArkDialog.Backdrop>) {
	return (
		<Portal>
			<ArkDialog.Backdrop
				className={cx(
					css({
						position: "fixed",
						inset: 0,
						bg: "rgba(0, 0, 0, 0.5)",
						zIndex: 50,
						"&[data-state='open']": {
							animation: "fadeIn 0.2s ease-out",
						},
						"&[data-state='closed']": {
							animation: "fadeOut 0.15s ease-in",
						},
					}),
					className,
				)}
				{...props}
			/>
		</Portal>
	);
}

/**
 * Dialog.Positioner - ダイアログポジショナー
 *
 * ダイアログコンテンツを中央に配置するコンテナです。
 */
function DialogPositioner({
	className,
	...props
}: ComponentProps<typeof ArkDialog.Positioner>) {
	return (
		<Portal>
			<ArkDialog.Positioner
				className={cx(
					css({
						position: "fixed",
						inset: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 50,
						padding: "4",
					}),
					className,
				)}
				{...props}
			/>
		</Portal>
	);
}

/**
 * Dialog.Content - ダイアログコンテンツ
 *
 * ダイアログの本体を表示する白いカードコンテナです。
 */
function DialogContent({
	className,
	...props
}: ComponentProps<typeof ArkDialog.Content>) {
	return (
		<ArkDialog.Content
			className={cx(
				css({
					position: "relative",
					bg: "white",
					borderRadius: "lg",
					boxShadow: "lg",
					padding: "6",
					maxWidth: "lg",
					width: "100%",
					maxHeight: "90vh",
					overflow: "auto",
					"&[data-state='open']": {
						animation: "fadeIn 0.2s ease-out, scaleIn 0.2s ease-out",
					},
					"&[data-state='closed']": {
						animation: "fadeOut 0.15s ease-in, scaleOut 0.15s ease-in",
					},
					_focus: {
						outline: "none",
					},
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Dialog.Title - ダイアログタイトル
 *
 * ダイアログのタイトルを表示するヘッディングです。
 */
function DialogTitle({
	className,
	...props
}: ComponentProps<typeof ArkDialog.Title>) {
	return (
		<ArkDialog.Title
			className={cx(
				css({
					fontSize: "lg",
					fontWeight: "semibold",
					color: "neutral.900",
					marginBottom: "2",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Dialog.Description - ダイアログ説明
 *
 * ダイアログの説明テキストを表示するコンポーネントです。
 */
function DialogDescription({
	className,
	...props
}: ComponentProps<typeof ArkDialog.Description>) {
	return (
		<ArkDialog.Description
			className={cx(
				css({
					fontSize: "sm",
					color: "neutral.500",
					marginBottom: "4",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Dialog.CloseTrigger - ダイアログ閉じるトリガー
 *
 * ダイアログを閉じるためのXボタンです。
 */
function DialogCloseTrigger({
	className,
	children,
	...props
}: ComponentProps<typeof ArkDialog.CloseTrigger>) {
	return (
		<ArkDialog.CloseTrigger
			className={cx(
				css({
					position: "absolute",
					top: "3",
					right: "3",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "8",
					height: "8",
					borderRadius: "md",
					bg: "transparent",
					border: "none",
					cursor: "pointer",
					color: "neutral.500",
					transition: "all 0.15s ease",
					_hover: {
						bg: "neutral.100",
						color: "neutral.700",
					},
					_focus: {
						outline: "2px solid",
						outlineColor: "neutral.400",
						outlineOffset: "2px",
					},
				}),
				className,
			)}
			{...props}
		>
			{children || (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<title>閉じる</title>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			)}
		</ArkDialog.CloseTrigger>
	);
}

/**
 * Dialog.Context - ダイアログコンテキスト
 *
 * ダイアログの状態にアクセスするためのコンテキストです。
 */
function DialogContext(props: ComponentProps<typeof ArkDialog.Context>) {
	return <ArkDialog.Context {...props} />;
}

/**
 * Dialogコンポーネント
 *
 * モーダルダイアログを構築するためのコンポーネント群をエクスポートします。
 */
export const Dialog = {
	Root: DialogRoot,
	Trigger: DialogTrigger,
	Backdrop: DialogBackdrop,
	Positioner: DialogPositioner,
	Content: DialogContent,
	Title: DialogTitle,
	Description: DialogDescription,
	CloseTrigger: DialogCloseTrigger,
	Context: DialogContext,
};
