"use client";

/**
 * SetupStepperコンポーネント
 *
 * セットアップウィザードのステップインジケータを表示するコンポーネントです。
 * 3ステップ（プロバイダ選択 → APIキー入力 → 完了）を表示します。
 *
 * @module components/setup/SetupStepper
 *
 * @example
 * ```tsx
 * <SetupStepper currentStep="provider" />
 * ```
 */

import { Steps } from "@/components/ui/steps";
import { getStepIndex, SETUP_STEPS, type SetupStep } from "./types";

/**
 * SetupStepperコンポーネントのProps
 */
interface SetupStepperProps {
	/** 現在のステップ */
	currentStep: SetupStep;
}

/**
 * セットアップステップインジケータ
 *
 * 3ステップ（プロバイダ選択 → APIキー入力 → 完了）を表示します。
 * 現在のステップがハイライトされ、完了したステップは塗りつぶされます。
 *
 * @param props - コンポーネントのProps
 * @param props.currentStep - 現在のステップID
 * @returns ステップインジケータ要素
 */
export function SetupStepper({ currentStep }: SetupStepperProps) {
	const currentIndex = getStepIndex(currentStep);

	return (
		<Steps.Root count={SETUP_STEPS.length} step={currentIndex}>
			<Steps.List>
				{SETUP_STEPS.map((step, index) => (
					<Steps.Item key={step.id} index={index}>
						<Steps.Trigger>
							<Steps.Indicator>{index + 1}</Steps.Indicator>
							<Steps.Title>{step.label}</Steps.Title>
						</Steps.Trigger>
						{/* 最後のステップ以外はセパレーターを表示 */}
						{index < SETUP_STEPS.length - 1 && <Steps.Separator />}
					</Steps.Item>
				))}
			</Steps.List>
		</Steps.Root>
	);
}
