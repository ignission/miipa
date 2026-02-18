/**
 * Stepsコンポーネント
 *
 * マルチステップUIを構築するためのカスタムコンポーネントです。
 * Web版の Ark UI Steps から移行し、NativeWind + React Native で再実装しています。
 *
 * @module components/ui/steps
 *
 * @example
 * ```tsx
 * <Steps currentStep={1} totalSteps={3}>
 *   <StepItem
 *     index={0}
 *     currentStep={1}
 *     totalSteps={3}
 *     title="認証"
 *   />
 *   <StepItem
 *     index={1}
 *     currentStep={1}
 *     totalSteps={3}
 *     title="設定"
 *   />
 *   <StepItem
 *     index={2}
 *     currentStep={1}
 *     totalSteps={3}
 *     title="完了"
 *   />
 * </Steps>
 * ```
 */

import type React from "react";
import { Pressable, Text, View } from "react-native";

/**
 * ステップの状態
 */
type StepStatus = "complete" | "current" | "upcoming";

/**
 * ステップの状態を判定する
 *
 * @param index - ステップのインデックス
 * @param currentStep - 現在のステップ
 * @returns ステップの状態
 */
function getStepStatus(index: number, currentStep: number): StepStatus {
	if (index < currentStep) return "complete";
	if (index === currentStep) return "current";
	return "upcoming";
}

// ============================================================
// Steps コンテナ
// ============================================================

/**
 * StepsコンポーネントのProps
 */
interface StepsProps {
	/** 現在のステップ（0始まり） */
	currentStep: number;
	/** ステップの総数 */
	totalSteps: number;
	/** 子要素（StepItem群） */
	children: React.ReactNode;
}

/**
 * ステップコンテナコンポーネント
 *
 * @param props - コンポーネントのProps
 * @returns ステップコンテナ要素
 */
export function Steps({ children }: StepsProps) {
	return <View className="w-full gap-4">{children}</View>;
}

// ============================================================
// StepList（ステップインジケーターの水平リスト）
// ============================================================

/**
 * StepListコンポーネントのProps
 */
interface StepListProps {
	/** 子要素（StepItem群） */
	children: React.ReactNode;
}

/**
 * ステップリストコンポーネント
 *
 * ステップインジケーターを水平に並べます。
 *
 * @param props - コンポーネントのProps
 * @returns ステップリスト要素
 */
export function StepList({ children }: StepListProps) {
	return (
		<View className="flex-row items-center justify-between gap-2">
			{children}
		</View>
	);
}

// ============================================================
// StepItem（個々のステップ）
// ============================================================

/**
 * StepItemコンポーネントのProps
 */
interface StepItemProps {
	/** ステップのインデックス（0始まり） */
	index: number;
	/** 現在のステップ */
	currentStep: number;
	/** ステップの総数 */
	totalSteps: number;
	/** ステップのタイトル */
	title: string;
	/** ステップタップ時のコールバック */
	onPress?: () => void;
}

/**
 * ステップアイテムコンポーネント
 *
 * 個々のステップを表示します。インジケーター、タイトル、セパレーターを含みます。
 *
 * @param props - コンポーネントのProps
 * @returns ステップアイテム要素
 */
export function StepItem({
	index,
	currentStep,
	totalSteps,
	title,
	onPress,
}: StepItemProps) {
	const status = getStepStatus(index, currentStep);
	const isLast = index === totalSteps - 1;

	return (
		<View className={`flex-row items-center gap-2 ${isLast ? "" : "flex-1"}`}>
			<Pressable
				className="flex-row items-center gap-2"
				onPress={onPress}
				disabled={!onPress}
				accessibilityRole="button"
				accessibilityLabel={`ステップ${index + 1}: ${title}`}
				accessibilityState={{
					selected: status === "current",
				}}
			>
				{/* インジケーター（番号円） */}
				<StepIndicator index={index} status={status} />

				{/* タイトル */}
				<Text
					className={`text-sm ${
						status === "current"
							? "font-semibold text-fg"
							: status === "complete"
								? "text-fg"
								: "text-fg-muted"
					}`}
				>
					{title}
				</Text>
			</Pressable>

			{/* セパレーター（最後のアイテム以外） */}
			{!isLast && <StepSeparator isComplete={status === "complete"} />}
		</View>
	);
}

// ============================================================
// StepIndicator（番号円）
// ============================================================

/**
 * StepIndicatorコンポーネントのProps
 */
interface StepIndicatorProps {
	/** ステップのインデックス */
	index: number;
	/** ステップの状態 */
	status: StepStatus;
}

/**
 * ステップインジケーターコンポーネント
 *
 * ステップ番号を円形で表示します。
 * 状態に応じて色が変わります。
 *
 * @param props - コンポーネントのProps
 * @returns ステップインジケーター要素
 */
function StepIndicator({ index, status }: StepIndicatorProps) {
	const bgClass =
		status === "upcoming"
			? "border-2 border-border bg-bg"
			: "bg-fg border-2 border-fg";
	const textClass = status === "upcoming" ? "text-fg-muted" : "text-white";

	return (
		<View
			className={`h-8 w-8 items-center justify-center rounded-full ${bgClass}`}
		>
			{status === "complete" ? (
				// チェックマーク
				<Text className="text-sm text-white">✓</Text>
			) : (
				<Text className={`text-sm font-medium ${textClass}`}>{index + 1}</Text>
			)}
		</View>
	);
}

// ============================================================
// StepSeparator（ステップ間の線）
// ============================================================

/**
 * StepSeparatorコンポーネントのProps
 */
interface StepSeparatorProps {
	/** 完了状態 */
	isComplete: boolean;
}

/**
 * ステップセパレーターコンポーネント
 *
 * ステップ間を繋ぐ線です。完了状態に応じて色が変わります。
 *
 * @param props - コンポーネントのProps
 * @returns ステップセパレーター要素
 */
function StepSeparator({ isComplete }: StepSeparatorProps) {
	return (
		<View className={`h-0.5 flex-1 ${isComplete ? "bg-fg" : "bg-border"}`} />
	);
}

// ============================================================
// StepContent（ステップ内容）
// ============================================================

/**
 * StepContentコンポーネントのProps
 */
interface StepContentProps {
	/** 表示対象のステップインデックス */
	index: number;
	/** 現在のステップ */
	currentStep: number;
	/** 子要素 */
	children: React.ReactNode;
}

/**
 * ステップコンテンツコンポーネント
 *
 * 現在のステップに対応するコンテンツのみ表示します。
 *
 * @param props - コンポーネントのProps
 * @returns ステップコンテンツ要素、または非表示時は null
 */
export function StepContent({
	index,
	currentStep,
	children,
}: StepContentProps) {
	if (index !== currentStep) return null;
	return <View className="mt-4">{children}</View>;
}

// ============================================================
// CompletedContent（全ステップ完了時のコンテンツ）
// ============================================================

/**
 * CompletedContentコンポーネントのProps
 */
interface CompletedContentProps {
	/** 現在のステップ */
	currentStep: number;
	/** ステップの総数 */
	totalSteps: number;
	/** 子要素 */
	children: React.ReactNode;
}

/**
 * 完了コンテンツコンポーネント
 *
 * 全ステップ完了後に表示するコンテンツです。
 *
 * @param props - コンポーネントのProps
 * @returns 完了コンテンツ要素、または未完了時は null
 */
export function CompletedContent({
	currentStep,
	totalSteps,
	children,
}: CompletedContentProps) {
	if (currentStep < totalSteps) return null;
	return <View className="mt-4">{children}</View>;
}
