"use client";

/**
 * Stepsコンポーネント
 *
 * Ark UIのStepsコンポーネントをPark UIスタイルでラップしたコンポーネントです。
 * セットアップウィザードなどのマルチステップUIで使用します。
 *
 * @module components/ui/steps
 *
 * @example
 * ```tsx
 * <Steps.Root count={3} step={1}>
 *   <Steps.List>
 *     <Steps.Item index={0}>
 *       <Steps.Trigger>
 *         <Steps.Indicator>1</Steps.Indicator>
 *       </Steps.Trigger>
 *       <Steps.Separator />
 *     </Steps.Item>
 *   </Steps.List>
 * </Steps.Root>
 * ```
 */

import { Steps as ArkSteps } from "@ark-ui/react/steps";
import type { ComponentProps } from "react";
import { css, cx } from "@/styled-system/css";

/**
 * Steps.Root - ステップコンテナ
 *
 * すべてのステップコンポーネントをラップするルートコンテナです。
 */
function StepsRoot({
	className,
	...props
}: ComponentProps<typeof ArkSteps.Root>) {
	return (
		<ArkSteps.Root
			className={cx(
				css({
					display: "flex",
					flexDirection: "column",
					gap: "4",
					width: "100%",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Steps.List - ステップリスト
 *
 * ステップアイテムを水平に並べるコンテナです。
 */
function StepsList({
	className,
	...props
}: ComponentProps<typeof ArkSteps.List>) {
	return (
		<ArkSteps.List
			className={cx(
				css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "2",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Steps.Item - ステップアイテム
 *
 * 個々のステップを表現するコンテナです。
 */
function StepsItem({
	className,
	...props
}: ComponentProps<typeof ArkSteps.Item>) {
	return (
		<ArkSteps.Item
			className={cx(
				css({
					display: "flex",
					alignItems: "center",
					flex: "1",
					gap: "2",
					"&[data-current]": {
						"& [data-part='indicator']": {
							bg: "neutral.12",
							color: "white",
							borderColor: "neutral.12",
						},
						"& [data-part='title']": {
							color: "fg.default",
							fontWeight: "semibold",
						},
					},
					"&[data-complete]": {
						"& [data-part='indicator']": {
							bg: "neutral.12",
							color: "white",
							borderColor: "neutral.12",
						},
						"& [data-part='separator']": {
							bg: "neutral.12",
						},
					},
					// 最後のアイテムはflex-growしない
					"&:last-child": {
						flex: "0 0 auto",
					},
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Steps.Trigger - ステップトリガー
 *
 * ステップをクリック可能にするトリガーボタンです。
 */
function StepsTrigger({
	className,
	...props
}: ComponentProps<typeof ArkSteps.Trigger>) {
	return (
		<ArkSteps.Trigger
			className={cx(
				css({
					display: "flex",
					alignItems: "center",
					gap: "2",
					cursor: "pointer",
					bg: "transparent",
					border: "none",
					padding: "0",
					_disabled: {
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
 * Steps.Indicator - ステップインジケーター
 *
 * ステップ番号やアイコンを表示するインジケーターです。
 */
function StepsIndicator({
	className,
	...props
}: ComponentProps<typeof ArkSteps.Indicator>) {
	return (
		<ArkSteps.Indicator
			data-part="indicator"
			className={cx(
				css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "8",
					height: "8",
					borderRadius: "full",
					border: "2px solid",
					borderColor: "border.default",
					bg: "bg.default",
					color: "fg.muted",
					fontSize: "sm",
					fontWeight: "medium",
					flexShrink: 0,
					transition: "all 0.2s ease",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Steps.Separator - ステップセパレーター
 *
 * ステップ間を繋ぐ線です。
 */
function StepsSeparator({
	className,
	...props
}: ComponentProps<typeof ArkSteps.Separator>) {
	return (
		<ArkSteps.Separator
			data-part="separator"
			className={cx(
				css({
					flex: "1",
					height: "0.5",
					bg: "border.default",
					transition: "all 0.2s ease",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Steps.Content - ステップコンテンツ
 *
 * 各ステップのコンテンツを表示するコンテナです。
 */
function StepsContent({
	className,
	...props
}: ComponentProps<typeof ArkSteps.Content>) {
	return (
		<ArkSteps.Content
			className={cx(
				css({
					mt: "4",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Steps.CompletedContent - 完了コンテンツ
 *
 * 全ステップ完了後に表示するコンテンツです。
 */
function StepsCompletedContent({
	className,
	...props
}: ComponentProps<typeof ArkSteps.CompletedContent>) {
	return (
		<ArkSteps.CompletedContent
			className={cx(
				css({
					mt: "4",
				}),
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Steps.Title - ステップタイトル
 *
 * ステップのタイトルを表示するコンポーネントです。
 * Ark UIにはないカスタムコンポーネントです。
 */
function StepsTitle({ className, children, ...props }: ComponentProps<"span">) {
	return (
		<span
			data-part="title"
			className={cx(
				css({
					fontSize: "sm",
					color: "fg.muted",
					transition: "all 0.2s ease",
					whiteSpace: "nowrap",
				}),
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}

/**
 * Steps.NextTrigger - 次へボタン
 */
function StepsNextTrigger({
	className,
	...props
}: ComponentProps<typeof ArkSteps.NextTrigger>) {
	return <ArkSteps.NextTrigger className={className} {...props} />;
}

/**
 * Steps.PrevTrigger - 戻るボタン
 */
function StepsPrevTrigger({
	className,
	...props
}: ComponentProps<typeof ArkSteps.PrevTrigger>) {
	return <ArkSteps.PrevTrigger className={className} {...props} />;
}

/**
 * Stepsコンポーネント
 *
 * マルチステップUIを構築するためのコンポーネント群をエクスポートします。
 */
export const Steps = {
	Root: StepsRoot,
	List: StepsList,
	Item: StepsItem,
	Trigger: StepsTrigger,
	Indicator: StepsIndicator,
	Separator: StepsSeparator,
	Content: StepsContent,
	CompletedContent: StepsCompletedContent,
	Title: StepsTitle,
	NextTrigger: StepsNextTrigger,
	PrevTrigger: StepsPrevTrigger,
};
