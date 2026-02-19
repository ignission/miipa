import { vars } from "nativewind";

// miipa テーマ設定
// Panda CSS トークンからマッピングしたカスタムカラーパレット
export const config = {
	light: vars({
		// プライマリ（オレンジ系 - miipa アクセントカラー）
		"--color-primary-0": "255 247 237", // accent-50
		"--color-primary-50": "255 237 213", // accent-100
		"--color-primary-100": "254 215 170", // accent-200
		"--color-primary-200": "253 186 116",
		"--color-primary-300": "251 146 60",
		"--color-primary-400": "249 115 22", // accent-500
		"--color-primary-500": "234 88 12", // accent-600
		"--color-primary-600": "194 65 12", // accent-700
		"--color-primary-700": "154 52 18",
		"--color-primary-800": "124 45 18",
		"--color-primary-900": "67 20 7",
		"--color-primary-950": "43 13 5",

		// セカンダリ（ストーン系 - 背景・テキスト用）
		"--color-secondary-0": "250 250 249", // bg-canvas
		"--color-secondary-50": "245 245 244", // bg-subtle
		"--color-secondary-100": "231 229 228", // bg-muted
		"--color-secondary-200": "214 211 209", // border
		"--color-secondary-300": "168 162 158", // fg-subtle
		"--color-secondary-400": "120 113 108", // fg-muted
		"--color-secondary-500": "87 83 78",
		"--color-secondary-600": "68 64 60",
		"--color-secondary-700": "44 42 41",
		"--color-secondary-800": "28 25 23", // fg
		"--color-secondary-900": "12 10 9",
		"--color-secondary-950": "2 2 2",

		// 背景
		"--color-background-0": "255 255 255", // bg
		"--color-background-50": "250 250 249", // bg-canvas
		"--color-background-100": "245 245 244", // bg-subtle
		"--color-background-200": "231 229 228", // bg-muted
		"--color-background-300": "214 211 209",
		"--color-background-400": "168 162 158",
		"--color-background-500": "120 113 108",
		"--color-background-error": "254 226 226",
		"--color-background-warning": "255 243 224",
		"--color-background-success": "220 252 231",
		"--color-background-muted": "245 245 244",
		"--color-background-info": "219 234 254",

		// エラー（赤系）
		"--color-error-0": "254 242 242",
		"--color-error-50": "254 226 226",
		"--color-error-100": "254 202 202",
		"--color-error-200": "252 165 165",
		"--color-error-300": "248 113 113",
		"--color-error-400": "239 68 68",
		"--color-error-500": "220 38 38",
		"--color-error-600": "185 28 28",
		"--color-error-700": "153 27 27",
		"--color-error-800": "127 29 29",
		"--color-error-900": "69 10 10",
		"--color-error-950": "40 5 5",

		// サクセス（緑系）
		"--color-success-0": "240 253 244",
		"--color-success-50": "220 252 231",
		"--color-success-100": "187 247 208",
		"--color-success-200": "134 239 172",
		"--color-success-300": "74 222 128",
		"--color-success-400": "34 197 94",
		"--color-success-500": "22 163 74",
		"--color-success-600": "21 128 61",
		"--color-success-700": "22 101 52",
		"--color-success-800": "20 83 45",
		"--color-success-900": "5 46 22",
		"--color-success-950": "2 28 12",

		// 警告（アンバー系）
		"--color-warning-0": "255 251 235",
		"--color-warning-50": "254 243 199",
		"--color-warning-100": "253 230 138",
		"--color-warning-200": "252 211 77",
		"--color-warning-300": "251 191 36",
		"--color-warning-400": "245 158 11",
		"--color-warning-500": "217 119 6",
		"--color-warning-600": "180 83 9",
		"--color-warning-700": "146 64 14",
		"--color-warning-800": "120 53 15",
		"--color-warning-900": "69 26 3",
		"--color-warning-950": "40 15 2",

		// インフォ（青系）
		"--color-info-0": "239 246 255",
		"--color-info-50": "219 234 254",
		"--color-info-100": "191 219 254",
		"--color-info-200": "147 197 253",
		"--color-info-300": "96 165 250",
		"--color-info-400": "59 130 246",
		"--color-info-500": "37 99 235",
		"--color-info-600": "29 78 216",
		"--color-info-700": "30 64 175",
		"--color-info-800": "30 58 138",
		"--color-info-900": "23 37 84",
		"--color-info-950": "14 22 51",

		// タイポグラフィ（ストーン系）
		"--color-typography-0": "255 255 255",
		"--color-typography-50": "250 250 249",
		"--color-typography-100": "245 245 244",
		"--color-typography-200": "231 229 228",
		"--color-typography-300": "214 211 209",
		"--color-typography-400": "168 162 158",
		"--color-typography-500": "120 113 108",
		"--color-typography-600": "87 83 78",
		"--color-typography-700": "68 64 60",
		"--color-typography-800": "44 42 41",
		"--color-typography-900": "28 25 23",
		"--color-typography-950": "12 10 9",

		// アウトライン（ボーダー系）
		"--color-outline-0": "255 255 255",
		"--color-outline-50": "250 250 249",
		"--color-outline-100": "245 245 244",
		"--color-outline-200": "231 229 228",
		"--color-outline-300": "214 211 209",
		"--color-outline-400": "168 162 158",
		"--color-outline-500": "120 113 108",
		"--color-outline-600": "87 83 78",
		"--color-outline-700": "68 64 60",
		"--color-outline-800": "44 42 41",
		"--color-outline-900": "28 25 23",
		"--color-outline-950": "12 10 9",

		// フォーカスインジケータ
		"--color-indicator-primary": "249 115 22",
		"--color-indicator-info": "59 130 246",
		"--color-indicator-error": "239 68 68",
	}),
	dark: vars({
		// ダークモード: 値を反転
		"--color-primary-0": "43 13 5",
		"--color-primary-50": "67 20 7",
		"--color-primary-100": "124 45 18",
		"--color-primary-200": "154 52 18",
		"--color-primary-300": "194 65 12",
		"--color-primary-400": "234 88 12",
		"--color-primary-500": "249 115 22",
		"--color-primary-600": "251 146 60",
		"--color-primary-700": "253 186 116",
		"--color-primary-800": "254 215 170",
		"--color-primary-900": "255 237 213",
		"--color-primary-950": "255 247 237",

		"--color-secondary-0": "2 2 2",
		"--color-secondary-50": "12 10 9",
		"--color-secondary-100": "28 25 23",
		"--color-secondary-200": "44 42 41",
		"--color-secondary-300": "68 64 60",
		"--color-secondary-400": "87 83 78",
		"--color-secondary-500": "120 113 108",
		"--color-secondary-600": "168 162 158",
		"--color-secondary-700": "214 211 209",
		"--color-secondary-800": "231 229 228",
		"--color-secondary-900": "245 245 244",
		"--color-secondary-950": "250 250 249",

		"--color-background-0": "18 18 18",
		"--color-background-50": "28 25 23",
		"--color-background-100": "44 42 41",
		"--color-background-200": "68 64 60",
		"--color-background-300": "87 83 78",
		"--color-background-400": "120 113 108",
		"--color-background-500": "168 162 158",
		"--color-background-error": "69 10 10",
		"--color-background-warning": "69 26 3",
		"--color-background-success": "5 46 22",
		"--color-background-muted": "44 42 41",
		"--color-background-info": "23 37 84",

		"--color-error-0": "40 5 5",
		"--color-error-50": "69 10 10",
		"--color-error-100": "127 29 29",
		"--color-error-200": "153 27 27",
		"--color-error-300": "185 28 28",
		"--color-error-400": "220 38 38",
		"--color-error-500": "239 68 68",
		"--color-error-600": "248 113 113",
		"--color-error-700": "252 165 165",
		"--color-error-800": "254 202 202",
		"--color-error-900": "254 226 226",
		"--color-error-950": "254 242 242",

		"--color-success-0": "2 28 12",
		"--color-success-50": "5 46 22",
		"--color-success-100": "20 83 45",
		"--color-success-200": "22 101 52",
		"--color-success-300": "21 128 61",
		"--color-success-400": "22 163 74",
		"--color-success-500": "34 197 94",
		"--color-success-600": "74 222 128",
		"--color-success-700": "134 239 172",
		"--color-success-800": "187 247 208",
		"--color-success-900": "220 252 231",
		"--color-success-950": "240 253 244",

		"--color-warning-0": "40 15 2",
		"--color-warning-50": "69 26 3",
		"--color-warning-100": "120 53 15",
		"--color-warning-200": "146 64 14",
		"--color-warning-300": "180 83 9",
		"--color-warning-400": "217 119 6",
		"--color-warning-500": "245 158 11",
		"--color-warning-600": "251 191 36",
		"--color-warning-700": "252 211 77",
		"--color-warning-800": "253 230 138",
		"--color-warning-900": "254 243 199",
		"--color-warning-950": "255 251 235",

		"--color-info-0": "14 22 51",
		"--color-info-50": "23 37 84",
		"--color-info-100": "30 58 138",
		"--color-info-200": "30 64 175",
		"--color-info-300": "29 78 216",
		"--color-info-400": "37 99 235",
		"--color-info-500": "59 130 246",
		"--color-info-600": "96 165 250",
		"--color-info-700": "147 197 253",
		"--color-info-800": "191 219 254",
		"--color-info-900": "219 234 254",
		"--color-info-950": "239 246 255",

		"--color-typography-0": "12 10 9",
		"--color-typography-50": "28 25 23",
		"--color-typography-100": "44 42 41",
		"--color-typography-200": "68 64 60",
		"--color-typography-300": "87 83 78",
		"--color-typography-400": "120 113 108",
		"--color-typography-500": "168 162 158",
		"--color-typography-600": "214 211 209",
		"--color-typography-700": "231 229 228",
		"--color-typography-800": "245 245 244",
		"--color-typography-900": "250 250 249",
		"--color-typography-950": "255 255 255",

		"--color-outline-0": "12 10 9",
		"--color-outline-50": "28 25 23",
		"--color-outline-100": "44 42 41",
		"--color-outline-200": "68 64 60",
		"--color-outline-300": "87 83 78",
		"--color-outline-400": "120 113 108",
		"--color-outline-500": "168 162 158",
		"--color-outline-600": "214 211 209",
		"--color-outline-700": "231 229 228",
		"--color-outline-800": "245 245 244",
		"--color-outline-900": "250 250 249",
		"--color-outline-950": "255 255 255",

		"--color-indicator-primary": "249 115 22",
		"--color-indicator-info": "96 165 250",
		"--color-indicator-error": "248 113 113",
	}),
};
