import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";

interface MeerkatHeroProps {
	/** スケーリング用サイズ（デフォルト 200） */
	size?: number;
}

/** メインのミーアキャット SVG（カレンダーを持っている） */
export function MeerkatHero({ size = 200 }: MeerkatHeroProps) {
	const scale = size / 200;
	const height = 240 * scale;

	return (
		<Svg width={size} height={height} viewBox="0 0 200 240">
			{/* 体（オレンジの楕円） */}
			<Ellipse cx={100} cy={160} rx={42} ry={60} fill="#F97316" />

			{/* お腹（明るい楕円） */}
			<Ellipse cx={100} cy={168} rx={28} ry={44} fill="#FED7AA" />

			{/* 頭（丸） */}
			<Circle cx={100} cy={80} r={36} fill="#F97316" />

			{/* 顔の明るい部分 */}
			<Ellipse cx={100} cy={88} rx={24} ry={20} fill="#FED7AA" />

			{/* 左耳 */}
			<Ellipse cx={72} cy={58} rx={10} ry={8} fill="#F97316" />
			<Ellipse cx={72} cy={58} rx={6} ry={5} fill="#FED7AA" />

			{/* 右耳 */}
			<Ellipse cx={128} cy={58} rx={10} ry={8} fill="#F97316" />
			<Ellipse cx={128} cy={58} rx={6} ry={5} fill="#FED7AA" />

			{/* 目（ドット） */}
			<Circle cx={88} cy={78} r={4} fill="#1c1917" />
			<Circle cx={112} cy={78} r={4} fill="#1c1917" />

			{/* 目のハイライト */}
			<Circle cx={90} cy={76} r={1.5} fill="#fff" />
			<Circle cx={114} cy={76} r={1.5} fill="#fff" />

			{/* 鼻 */}
			<Ellipse cx={100} cy={88} rx={4} ry={3} fill="#1c1917" />

			{/* 口 */}
			<Path
				d="M96 93 Q100 97 104 93"
				fill="none"
				stroke="#1c1917"
				strokeWidth={1.5}
				strokeLinecap="round"
			/>

			{/* 左腕（カレンダーの後ろ） */}
			<Path
				d="M66 140 Q56 150 68 165"
				fill="#F97316"
				stroke="#F97316"
				strokeWidth={8}
				strokeLinecap="round"
			/>

			{/* カレンダー（白い長方形） */}
			<G>
				<Rect
					x={72}
					y={128}
					width={56}
					height={68}
					rx={4}
					fill="#fff"
					stroke="#e7e5e4"
					strokeWidth={1}
				/>
				{/* カレンダーヘッダー */}
				<Rect x={72} y={128} width={56} height={14} rx={4} fill="#F97316" />
				{/* カレンダー上部の角を四角にする */}
				<Rect x={72} y={138} width={56} height={4} fill="#F97316" />

				{/* 予定ライン */}
				<Line
					x1={80}
					y1={152}
					x2={108}
					y2={152}
					stroke="#F97316"
					strokeWidth={3}
					strokeLinecap="round"
				/>
				<Line
					x1={80}
					y1={162}
					x2={118}
					y2={162}
					stroke="#FED7AA"
					strokeWidth={3}
					strokeLinecap="round"
				/>
				<Line
					x1={80}
					y1={172}
					x2={100}
					y2={172}
					stroke="#EA580C"
					strokeWidth={3}
					strokeLinecap="round"
				/>
				<Line
					x1={80}
					y1={182}
					x2={114}
					y2={182}
					stroke="#FED7AA"
					strokeWidth={3}
					strokeLinecap="round"
				/>
			</G>

			{/* 右腕（カレンダーの前） */}
			<Path
				d="M134 140 Q144 150 132 165"
				fill="#F97316"
				stroke="#F97316"
				strokeWidth={8}
				strokeLinecap="round"
			/>

			{/* 足 */}
			<Ellipse cx={84} cy={218} rx={14} ry={8} fill="#F97316" />
			<Ellipse cx={116} cy={218} rx={14} ry={8} fill="#F97316" />
		</Svg>
	);
}
