import { View, type ViewProps } from "react-native";

interface SectionWrapperProps extends ViewProps {
	children: React.ReactNode;
	className?: string;
}

/** セクション共通ラッパー（px-6 py-16 をデフォルト適用） */
export function SectionWrapper({
	children,
	className = "",
	...rest
}: SectionWrapperProps) {
	return (
		<View className={`px-6 py-16 ${className}`.trim()} {...rest}>
			{children}
		</View>
	);
}
