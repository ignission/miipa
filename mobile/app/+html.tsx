import { ScrollViewStyleReset } from "expo-router/html";

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, shrink-to-fit=no"
				/>

				<title>miipa - カレンダーAIアシスタント</title>
				<meta
					name="description"
					content="複数カレンダーを統合して「今日の自分」を30秒で把握。一人社長向けカレンダーAIアシスタント。"
				/>

				{/* Open Graph */}
				<meta property="og:title" content="miipa - カレンダーAIアシスタント" />
				<meta
					property="og:description"
					content="複数カレンダーを統合して「今日の自分」を30秒で把握。一人社長向けカレンダーAIアシスタント。"
				/>
				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://miipa.app" />
				<meta property="og:site_name" content="miipa" />

				{/* Twitter Card */}
				<meta name="twitter:card" content="summary" />
				<meta name="twitter:title" content="miipa - カレンダーAIアシスタント" />
				<meta
					name="twitter:description"
					content="複数カレンダーを統合して「今日の自分」を30秒で把握。一人社長向けカレンダーAIアシスタント。"
				/>

				{/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
				<ScrollViewStyleReset />

				{/*
          dangerouslySetInnerHTML を使用しているが、responsiveBackground は
          このファイル内で定義された静的な文字列定数であり、ユーザー入力や
          外部データを一切含まないため安全である。
          ダークモード時の背景色フリッカー防止のために使用。
        */}
				<style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
				{/* Add any additional <head> elements that you want globally available on web... */}
			</head>
			<body>{children}</body>
		</html>
	);
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
