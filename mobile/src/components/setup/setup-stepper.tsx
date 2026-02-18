/**
 * SetupStepperコンポーネント
 *
 * セットアップウィザードのステップインジケータを表示するコンポーネントです。
 * 3ステップ（カレンダー設定 → AI設定 → 完了）を表示します。
 * NativeWindカスタムステッパーで実装。
 *
 * @module components/setup/setup-stepper
 */

import { Text, View } from "react-native";
import {
	SETUP_STEPS,
	type SetupStep,
	getStepIndex,
} from "./types";

// ============================================================
// 型定義
// ============================================================

/**
 * SetupStepperコンポーネントのProps
 */
interface SetupStepperProps {
	/** 現在のステップ */
	currentStep: SetupStep;
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * セットアップステップインジケータ
 *
 * 3ステップのインジケータを表示します。
 * - 完了: 緑丸 + チェック
 * - 現在: アクセント色の丸
 * - 未着手: グレーの丸
 *
 * @param props - コンポーネントのProps
 * @returns ステップインジケータ要素
 */
export function SetupStepper({ currentStep }: SetupStepperProps) {
	const currentIndex = getStepIndex(currentStep);

	return (
		<View className="flex-row items-center justify-center px-4 py-4">
			{SETUP_STEPS.map((step, index) => {
				const isCompleted = index < currentIndex;
				const isCurrent = index === currentIndex;

				return (
					<View key={step.id} className="flex-row items-center">
						{/* ステップインジケータ */}
						<View className="items-center">
							{/* 番号/チェックマーク */}
							<View
								className={`h-8 w-8 items-center justify-center rounded-full ${
									isCompleted
										? "bg-green-500"
										: isCurrent
											? "bg-accent"
											: "bg-bg-muted"
								}`}
							>
								<Text
									className={`text-sm font-bold ${
										isCompleted || isCurrent
											? "text-white"
											: "text-fg-muted"
									}`}
								>
									{isCompleted ? "✓" : String(index + 1)}
								</Text>
							</View>

							{/* ラベル */}
							<Text
								className={`mt-1 text-xs ${
									isCurrent
										? "font-medium text-fg"
										: "text-fg-muted"
								}`}
							>
								{step.label}
							</Text>
						</View>

						{/* セパレーター（最後のステップ以外） */}
						{index < SETUP_STEPS.length - 1 && (
							<View
								className={`mx-2 h-0.5 w-8 ${
									index < currentIndex
										? "bg-green-500"
										: "bg-bg-muted"
								}`}
							/>
						)}
					</View>
				);
			})}
		</View>
	);
}
