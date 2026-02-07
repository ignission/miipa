import type { Metadata } from "next";
import "./globals.css";
import "@/styled-system/styles.css";

export const metadata: Metadata = {
	title: "SoloDay",
	description: "一人社長向けカレンダー統合AIアシスタント",
	manifest: "/manifest.json",
	themeColor: "#F59E0B",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "SoloDay",
	},
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
	},
	icons: {
		icon: "/favicon.ico",
		apple: "/icons/icon-192.png",
	},
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
			<body>
				{children}
				{/* Service Worker登録 */}
				<script
					dangerouslySetInnerHTML={{
						__html: `
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function() {
		navigator.serviceWorker.register('/sw.js');
	});
}
`,
					}}
				/>
			</body>
		</html>
	);
}
