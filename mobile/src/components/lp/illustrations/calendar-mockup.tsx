import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

interface CalendarMockupProps {
	/** スケーリング用サイズ（デフォルト 180） */
	size?: number;
}

/** スタイリッシュなアプリ画面モックアップ SVG */
export function CalendarMockup({ size = 180 }: CalendarMockupProps) {
	const scale = size / 180;
	const height = 280 * scale;

	return (
		<Svg width={size} height={height} viewBox="0 0 180 280">
			{/* シャドウ（背景に薄い矩形を重ねて表現） */}
			<Rect
				x={10}
				y={12}
				width={164}
				height={264}
				rx={16}
				fill="#1c1917"
				opacity={0.06}
			/>

			{/* フォンフレーム */}
			<Rect
				x={8}
				y={8}
				width={164}
				height={264}
				rx={16}
				fill="#fff"
				stroke="#e7e5e4"
				strokeWidth={1.5}
			/>

			{/* ステータスバー */}
			<Rect x={8} y={8} width={164} height={32} rx={16} fill="#f5f5f4" />
			{/* 角の丸み修正 */}
			<Rect x={8} y={24} width={164} height={16} fill="#f5f5f4" />

			{/* ヘッダーテキスト */}
			<SvgText
				x={90}
				y={28}
				textAnchor="middle"
				fontSize={11}
				fontWeight="600"
				fill="#44403c"
			>
				Today
			</SvgText>

			{/* 区切り線 */}
			<Line
				x1={20}
				y1={44}
				x2={160}
				y2={44}
				stroke="#e7e5e4"
				strokeWidth={0.5}
			/>

			{/* 時間ラベル */}
			<SvgText x={24} y={68} fontSize={8} fill="#a8a29e">
				9:00
			</SvgText>
			<SvgText x={24} y={118} fontSize={8} fill="#a8a29e">
				11:00
			</SvgText>
			<SvgText x={24} y={168} fontSize={8} fill="#a8a29e">
				14:00
			</SvgText>
			<SvgText x={24} y={218} fontSize={8} fill="#a8a29e">
				16:00
			</SvgText>

			{/* 予定バー 1: ミーティング */}
			<G>
				<Rect x={52} y={56} width={104} height={36} rx={6} fill="#F97316" />
				<SvgText x={62} y={72} fontSize={9} fontWeight="600" fill="#fff">
					Team MTG
				</SvgText>
				<SvgText x={62} y={84} fontSize={7} fill="rgba(255,255,255,0.8)">
					9:00 - 10:00
				</SvgText>
			</G>

			{/* 予定バー 2: ランチ */}
			<G>
				<Rect x={52} y={106} width={72} height={28} rx={6} fill="#FED7AA" />
				<SvgText x={62} y={122} fontSize={9} fontWeight="600" fill="#78716c">
					Lunch
				</SvgText>
				<SvgText x={62} y={130} fontSize={7} fill="#a8a29e">
					11:30 - 12:30
				</SvgText>
			</G>

			{/* 予定バー 3: レビュー */}
			<G>
				<Rect x={52} y={156} width={96} height={32} rx={6} fill="#EA580C" />
				<SvgText x={62} y={174} fontSize={9} fontWeight="600" fill="#fff">
					Design Review
				</SvgText>
				<SvgText x={62} y={184} fontSize={7} fill="rgba(255,255,255,0.8)">
					14:00 - 15:00
				</SvgText>
			</G>

			{/* 予定バー 4: フォーカスタイム */}
			<G>
				<Rect
					x={52}
					y={206}
					width={88}
					height={28}
					rx={6}
					fill="#FED7AA"
					opacity={0.7}
				/>
				<SvgText x={62} y={222} fontSize={9} fontWeight="600" fill="#78716c">
					Focus Time
				</SvgText>
				<SvgText x={62} y={230} fontSize={7} fill="#a8a29e">
					16:00 - 17:30
				</SvgText>
			</G>

			{/* ホームインジケーター */}
			<Rect x={70} y={258} width={40} height={4} rx={2} fill="#d6d3d1" />
		</Svg>
	);
}
