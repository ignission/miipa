import type { Config } from "tailwindcss";

export default {
	content: [
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
	],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				// Panda CSS トークンからのマッピング
				bg: {
					canvas: "#fafaf9",
					DEFAULT: "#ffffff",
					subtle: "#f5f5f4",
					muted: "#e7e5e4",
				},
				fg: {
					DEFAULT: "#1c1917",
					muted: "#78716c",
					subtle: "#a8a29e",
				},
				accent: {
					DEFAULT: "#F97316",
					fg: "#ffffff",
					"50": "#FFF7ED",
					"100": "#FFEDD5",
					"200": "#FED7AA",
					"500": "#F97316",
					"600": "#EA580C",
					"700": "#C2410C",
				},
				border: {
					DEFAULT: "#d6d3d1",
					muted: "#e7e5e4",
				},
			},
			fontFamily: {
				sans: ["System", "sans-serif"],
			},
		},
	},
	plugins: [],
} satisfies Config;
