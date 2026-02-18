/**
 * Switchコンポーネント
 *
 * React Native の Switch を NativeWind でラップしたコンポーネントです。
 * Web版の Ark UI Switch から移行しています。
 *
 * @module components/ui/switch
 *
 * @example
 * ```tsx
 * <LabeledSwitch
 *   label="通知を有効にする"
 *   value={enabled}
 *   onValueChange={setEnabled}
 * />
 * ```
 */

import {
	Switch as RNSwitch,
	Text,
	View,
	type SwitchProps as RNSwitchProps,
} from "react-native";

/**
 * LabeledSwitchコンポーネントのProps
 */
interface LabeledSwitchProps {
	/** スイッチのラベルテキスト */
	label: string;
	/** スイッチの値 */
	value: boolean;
	/** 値変更時のコールバック */
	onValueChange: (value: boolean) => void;
	/** 無効状態 */
	disabled?: boolean;
	/** React Native Switch に渡す追加Props */
	switchProps?: Omit<RNSwitchProps, "value" | "onValueChange" | "disabled">;
}

/**
 * ラベル付きスイッチコンポーネント
 *
 * ON/OFF切り替えUIをラベル付きで提供します。
 * トラック色はアクセントカラー（ON時）とグレー（OFF時）です。
 *
 * @param props - コンポーネントのProps
 * @returns ラベル付きスイッチ要素
 */
export function LabeledSwitch({
	label,
	value,
	onValueChange,
	disabled = false,
	switchProps,
}: LabeledSwitchProps) {
	return (
		<View
			className={`flex-row items-center gap-2 ${disabled ? "opacity-50" : ""}`}
		>
			<RNSwitch
				value={value}
				onValueChange={onValueChange}
				disabled={disabled}
				trackColor={{ false: "#d6d3d1", true: "#1c1917" }}
				thumbColor="#ffffff"
				{...switchProps}
			/>
			<Text className="text-sm text-fg">{label}</Text>
		</View>
	);
}

/**
 * スタンドアロンSwitchコンポーネントのProps
 */
interface SwitchComponentProps {
	/** スイッチの値 */
	value: boolean;
	/** 値変更時のコールバック */
	onValueChange: (value: boolean) => void;
	/** 無効状態 */
	disabled?: boolean;
}

/**
 * スタンドアロンスイッチコンポーネント
 *
 * ラベルなしのスイッチUIです。
 *
 * @param props - コンポーネントのProps
 * @returns スイッチ要素
 */
export function Switch({
	value,
	onValueChange,
	disabled = false,
}: SwitchComponentProps) {
	return (
		<RNSwitch
			value={value}
			onValueChange={onValueChange}
			disabled={disabled}
			trackColor={{ false: "#d6d3d1", true: "#1c1917" }}
			thumbColor="#ffffff"
		/>
	);
}
