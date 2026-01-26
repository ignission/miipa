import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "SoloDay",
	description: "一人社長向けカレンダー統合AIアシスタント",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="ja">
			<body>{children}</body>
		</html>
	);
}
