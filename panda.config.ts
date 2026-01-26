import { defineConfig } from "@pandacss/dev";
import { createPreset } from "@park-ui/panda-preset";
import neutral from "@park-ui/panda-preset/colors/neutral";
import sand from "@park-ui/panda-preset/colors/sand";

export default defineConfig({
	// CSS リセットを適用
	preflight: true,

	// Park UI プリセット
	presets: [
		createPreset({
			accentColor: neutral,
			grayColor: sand,
			radius: "sm",
		}),
	],

	// CSS 宣言を探すパス（Next.js App Router 用）
	include: [
		"./app/**/*.{js,jsx,ts,tsx}",
		"./components/**/*.{js,jsx,ts,tsx}",
		"./lib/**/*.{js,jsx,ts,tsx}",
	],

	// 除外するファイル
	exclude: [],

	// JSX フレームワーク設定
	jsxFramework: "react",

	// テーマのカスタマイズ
	theme: {
		extend: {
			keyframes: {
				bounce: {
					"0%, 100%": {
						transform: "translateY(0)",
					},
					"50%": {
						transform: "translateY(-8px)",
					},
				},
			},
		},
	},

	// 出力ディレクトリ
	outdir: "styled-system",
});
