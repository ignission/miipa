import { css } from "../styled-system/css";

export default function Home() {
	return (
		<main
			className={css({
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				padding: "8",
			})}
		>
			<h1
				className={css({
					fontSize: "2xl",
					fontWeight: "bold",
					marginBottom: "4",
				})}
			>
				SoloDay
			</h1>
			<p className={css({ color: "gray.500" })}>
				一人社長向けカレンダー統合AIアシスタント
			</p>
		</main>
	);
}
