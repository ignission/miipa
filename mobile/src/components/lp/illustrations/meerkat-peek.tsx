import Svg, {
	Circle,
	ClipPath,
	Defs,
	Ellipse,
	G,
	Path,
	Rect,
} from "react-native-svg";

interface MeerkatPeekProps {
	/** スケーリング用サイズ（デフォルト 100） */
	size?: number;
}

/** 右下から覗くミーアキャット SVG */
export function MeerkatPeek({ size = 100 }: MeerkatPeekProps) {
	const scale = size / 100;
	const height = 100 * scale;

	return (
		<Svg width={size} height={height} viewBox="0 0 100 100">
			<Defs>
				{/* 下半分をクリップして「覗いている」感じに */}
				<ClipPath id="peekClip">
					<Rect x={0} y={0} width={100} height={100} />
				</ClipPath>
			</Defs>

			<G clipPath="url(#peekClip)">
				{/* 体（下半分は見えない） */}
				<Ellipse cx={60} cy={90} rx={24} ry={34} fill="#F97316" />

				{/* お腹 */}
				<Ellipse cx={60} cy={94} rx={16} ry={26} fill="#FED7AA" />

				{/* 頭 */}
				<Circle cx={60} cy={44} r={22} fill="#F97316" />

				{/* 顔の明るい部分 */}
				<Ellipse cx={60} cy={49} rx={15} ry={12} fill="#FED7AA" />

				{/* 左耳 */}
				<Ellipse cx={43} cy={30} rx={6} ry={5} fill="#F97316" />
				<Ellipse cx={43} cy={30} rx={4} ry={3} fill="#FED7AA" />

				{/* 右耳 */}
				<Ellipse cx={77} cy={30} rx={6} ry={5} fill="#F97316" />
				<Ellipse cx={77} cy={30} rx={4} ry={3} fill="#FED7AA" />

				{/* 目 */}
				<Circle cx={52} cy={42} r={2.5} fill="#1c1917" />
				<Circle cx={68} cy={42} r={2.5} fill="#1c1917" />

				{/* 目のハイライト */}
				<Circle cx={53} cy={41} r={1} fill="#fff" />
				<Circle cx={69} cy={41} r={1} fill="#fff" />

				{/* 鼻 */}
				<Ellipse cx={60} cy={49} rx={2.5} ry={2} fill="#1c1917" />

				{/* 口 */}
				<Path
					d="M57 53 Q60 56 63 53"
					fill="none"
					stroke="#1c1917"
					strokeWidth={1}
					strokeLinecap="round"
				/>

				{/* 手を振っている左腕 */}
				<G>
					<Path
						d="M38 68 Q28 56 24 48"
						fill="none"
						stroke="#F97316"
						strokeWidth={6}
						strokeLinecap="round"
					/>
					{/* 手（丸） */}
					<Circle cx={24} cy={46} r={5} fill="#F97316" />
				</G>

				{/* 右腕（体の横） */}
				<Path
					d="M82 68 Q88 76 86 84"
					fill="none"
					stroke="#F97316"
					strokeWidth={6}
					strokeLinecap="round"
				/>
			</G>
		</Svg>
	);
}
