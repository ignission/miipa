/**
 * miipa カラーテーマ
 * Panda CSS のカラートークンからの移植
 */
export const colors = {
	primary: {
		50: "#FFF7ED",
		100: "#FFEDD5",
		200: "#FED7AA",
		300: "#FDBA74",
		400: "#FB923C",
		500: "#F97316",
		600: "#EA580C",
		700: "#C2410C",
		800: "#9A3412",
		900: "#7C2D12",
	},
	gray: {
		50: "#FAFAFA",
		100: "#F5F5F5",
		200: "#E5E5E5",
		300: "#D4D4D4",
		400: "#A3A3A3",
		500: "#737373",
		600: "#525252",
		700: "#404040",
		800: "#262626",
		900: "#171717",
	},
	red: {
		500: "#EF4444",
		600: "#DC2626",
	},
	green: {
		500: "#22C55E",
	},
	blue: {
		500: "#3B82F6",
	},
	white: "#FFFFFF",
	black: "#000000",
} as const;

/**
 * デフォルトカレンダー色
 */
export const DEFAULT_CALENDAR_COLOR = "#6B7280";
