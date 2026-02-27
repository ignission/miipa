import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

interface TabBarIconProps {
	name: ComponentProps<typeof Ionicons>["name"];
	color: string;
}

export function TabBarIcon({ name, color }: TabBarIconProps) {
	return (
		<Ionicons
			size={24}
			style={{ marginBottom: -3 }}
			name={name}
			color={color}
		/>
	);
}
