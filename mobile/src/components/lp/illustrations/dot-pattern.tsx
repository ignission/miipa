import Svg, { Circle } from "react-native-svg";

interface DotPatternProps {
	/** 幅（デフォルト 200） */
	width?: number;
	/** 高さ（デフォルト 200） */
	height?: number;
}

/** デコレーション用ドットグリッド背景 */
export function DotPattern({ width = 200, height = 200 }: DotPatternProps) {
	const spacing = 20;
	const radius = 2;

	const cols = Math.floor(width / spacing);
	const rows = Math.floor(height / spacing);

	const dots: Array<{ cx: number; cy: number; key: string }> = [];
	for (let row = 0; row <= rows; row++) {
		for (let col = 0; col <= cols; col++) {
			const cx = col * spacing + spacing / 2;
			const cy = row * spacing + spacing / 2;
			if (cx <= width && cy <= height) {
				dots.push({ cx, cy, key: `${col}-${row}` });
			}
		}
	}

	return (
		<Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
			{dots.map(({ cx, cy, key }) => (
				<Circle
					key={key}
					cx={cx}
					cy={cy}
					r={radius}
					fill="#e7e5e4"
					opacity={0.4}
				/>
			))}
		</Svg>
	);
}
