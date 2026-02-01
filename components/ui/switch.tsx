"use client";

/**
 * Switchコンポーネント
 *
 * Ark UIのSwitchコンポーネントをPark UIスタイルでラップしたコンポーネントです。
 * ON/OFFの切り替えUIで使用します。
 *
 * @module components/ui/switch
 *
 * @example
 * ```tsx
 * <Switch.Root checked={enabled} onCheckedChange={({ checked }) => setEnabled(checked)}>
 *   <Switch.Control>
 *     <Switch.Thumb />
 *   </Switch.Control>
 *   <Switch.Label>通知を有効にする</Switch.Label>
 * </Switch.Root>
 * ```
 */

import { Switch as ArkSwitch } from "@ark-ui/react/switch";
import type { ComponentProps } from "react";
import { css, cx } from "@/styled-system/css";

/**
 * Switch.Root - スイッチコンテナ
 *
 * スイッチコンポーネントのルートコンテナです。
 * checked, onCheckedChange, disabled などのpropsを受け取ります。
 */
function SwitchRoot({
	className,
	...props
}: ComponentProps<typeof ArkSwitch.Root>) {
	return (
		<ArkSwitch.Root
			className={cx(
				css({
					display: "flex",
					alignItems: "center",
					gap: "2",
					cursor: "pointer",
					"&[data-disabled]": {
						cursor: "not-allowed",
						opacity: 0.5,
					},
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Switch.Control - スイッチコントロール（トラック）
 *
 * スイッチのトラック部分（背景）を表現するコンポーネントです。
 * OFF時はグレー、ON時はアクセントカラーになります。
 */
function SwitchControl({
	className,
	...props
}: ComponentProps<typeof ArkSwitch.Control>) {
	return (
		<ArkSwitch.Control
			className={cx(
				css({
					display: "flex",
					alignItems: "center",
					width: "11",
					height: "6",
					borderRadius: "full",
					bg: "neutral.6",
					padding: "0.5",
					transition: "background 0.2s ease",
					flexShrink: 0,
					"&[data-state='checked']": {
						bg: "neutral.12",
					},
					"&[data-disabled]": {
						bg: "neutral.4",
					},
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Switch.Thumb - スイッチサム（つまみ）
 *
 * スイッチの可動部分（白い丸）を表現するコンポーネントです。
 * ON/OFFに応じて左右にスライドします。
 */
function SwitchThumb({
	className,
	...props
}: ComponentProps<typeof ArkSwitch.Thumb>) {
	return (
		<ArkSwitch.Thumb
			className={cx(
				css({
					width: "5",
					height: "5",
					borderRadius: "full",
					bg: "white",
					boxShadow: "sm",
					transition: "transform 0.2s ease",
					"&[data-state='checked']": {
						transform: "translateX(100%)",
					},
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Switch.Label - スイッチラベル
 *
 * スイッチの横に表示するラベルテキストです。
 */
function SwitchLabel({
	className,
	...props
}: ComponentProps<typeof ArkSwitch.Label>) {
	return (
		<ArkSwitch.Label
			className={cx(
				css({
					fontSize: "sm",
					color: "fg.default",
					userSelect: "none",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Switch.HiddenInput - 隠しinput
 *
 * フォーム送信用の隠しinput要素です。
 */
function SwitchHiddenInput(
	props: ComponentProps<typeof ArkSwitch.HiddenInput>,
) {
	return <ArkSwitch.HiddenInput {...props} />;
}

/**
 * Switchコンポーネント
 *
 * ON/OFF切り替えUIを構築するためのコンポーネント群をエクスポートします。
 */
export const Switch = {
	Root: SwitchRoot,
	Control: SwitchControl,
	Thumb: SwitchThumb,
	Label: SwitchLabel,
	HiddenInput: SwitchHiddenInput,
};
