import type { Metadata } from "next";
import "./globals.css";
import "@/styled-system/styles.css";

export const metadata: Metadata = {
	title: "SoloDay",
	description: "一人社長向けカレンダー統合AIアシスタント",
};

/**
 * ダークモード自動切り替えスクリプト
 *
 * システムのprefers-color-schemeを検知し、
 * html要素にlightまたはdarkクラスを設定します。
 * ページ読み込み時にFOUC（ちらつき）を防ぐため、
 * script要素として直接埋め込みます。
 */
const darkModeScript = `
(function() {
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	document.documentElement.classList.add(prefersDark ? 'dark' : 'light');

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(e.matches ? 'dark' : 'light');
	});
})();
`;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
			</head>
			<body>{children}</body>
		</html>
	);
}
