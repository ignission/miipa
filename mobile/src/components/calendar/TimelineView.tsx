import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import type { UICalendarEvent } from "../../hooks/useEvents";
import { DEFAULT_CALENDAR_COLOR } from "../../theme";

/** 1時間あたりの高さ（px） */
const HOUR_HEIGHT = 80;
/** 表示開始時刻 */
const DAY_START_HOUR = 6;
/** 表示終了時刻 */
const DAY_END_HOUR = 22;
/** 時刻ラベルの幅 */
const TIME_LABEL_WIDTH = 50;
/** イベント領域の左オフセット */
const EVENT_LEFT_OFFSET = TIME_LABEL_WIDTH + 4;
/** イベント領域の右パディング */
const PADDING_RIGHT = 16;
/** 列間の隙間（px） */
const COLUMN_GAP = 2;

// ============================================================
// 列レイアウト計算（重複イベントの横並び表示用）
// ============================================================

/** 列割り当て結果 */
interface ColumnLayout {
	/** 0始まりの列番号 */
	column: number;
	/** このイベントの重複グループの総列数 */
	totalColumns: number;
	/** 右方向に拡張できる列数（1=拡張なし） */
	span: number;
}

/**
 * 2つのイベントが時間的に重複しているかを判定
 *
 * 重複条件: A開始 < B終了 かつ B開始 < A終了
 * 境界が一致する場合（A終了 = B開始）は重複とみなさない
 */
function eventsOverlap(a: UICalendarEvent, b: UICalendarEvent): boolean {
	return (
		a.startTime.getTime() < b.endTime.getTime() &&
		b.startTime.getTime() < a.endTime.getTime()
	);
}

/**
 * 重複するイベントに列レイアウト情報を割り当てる
 *
 * API側の assignColumns + calculateTotalColumnsPerEvent と同等のアルゴリズムを
 * Date オブジェクトベースで実装。
 *
 * 1. 開始時刻でソート
 * 2. 貪欲法で列番号を割り当て（各列の終了時刻を追跡）
 * 3. 重複するイベントのグループごとに totalColumns を計算
 */
function calculateColumnLayout(
	events: UICalendarEvent[],
): Map<string, ColumnLayout> {
	if (events.length === 0) {
		return new Map();
	}

	// 開始時刻でソート
	const sorted = [...events].sort(
		(a, b) => a.startTime.getTime() - b.startTime.getTime(),
	);

	// 貪欲法で列番号を割り当て
	const columnEndTimes: number[] = [];
	const columnMap = new Map<string, number>();

	for (const event of sorted) {
		const eventStart = event.startTime.getTime();
		const eventEnd = event.endTime.getTime();

		// 重複しない最小の列を探す
		let assignedColumn = -1;
		for (let col = 0; col < columnEndTimes.length; col++) {
			if (columnEndTimes[col] <= eventStart) {
				assignedColumn = col;
				break;
			}
		}

		// 既存の列に配置できない場合は新しい列を追加
		if (assignedColumn === -1) {
			assignedColumn = columnEndTimes.length;
			columnEndTimes.push(eventEnd);
		} else {
			columnEndTimes[assignedColumn] = eventEnd;
		}

		columnMap.set(event.id, assignedColumn);
	}

	// 重複の連結成分（クラスタ）を Union-Find で構築
	// 直接重複しないイベントでも、間接的に繋がっていれば同じクラスタ
	const parent = new Map<string, string>();
	const find = (id: string): string => {
		let root = id;
		while (parent.get(root) !== root) {
			root = parent.get(root) ?? root;
		}
		// 経路圧縮
		let current = id;
		while (current !== root) {
			const next = parent.get(current) ?? current;
			parent.set(current, root);
			current = next;
		}
		return root;
	};
	const union = (a: string, b: string) => {
		const ra = find(a);
		const rb = find(b);
		if (ra !== rb) parent.set(ra, rb);
	};

	for (const e of events) parent.set(e.id, e.id);
	for (let i = 0; i < events.length; i++) {
		for (let j = i + 1; j < events.length; j++) {
			if (eventsOverlap(events[i], events[j])) {
				union(events[i].id, events[j].id);
			}
		}
	}

	// クラスタごとの最大列番号を計算
	const clusterMaxColumn = new Map<string, number>();
	for (const event of events) {
		const root = find(event.id);
		const col = columnMap.get(event.id) ?? 0;
		clusterMaxColumn.set(root, Math.max(clusterMaxColumn.get(root) ?? 0, col));
	}

	// 同じクラスタのイベントは同じ totalColumns を共有
	const result = new Map<string, ColumnLayout>();
	for (const event of events) {
		const root = find(event.id);
		const col = columnMap.get(event.id) ?? 0;
		const totalColumns = (clusterMaxColumn.get(root) ?? 0) + 1;

		// 右方向に空き列があれば拡張（Google Calendar 方式）
		const overlapping = events.filter(
			(other) => other.id !== event.id && eventsOverlap(event, other),
		);
		let span = 1;
		for (let c = col + 1; c < totalColumns; c++) {
			if (overlapping.some((o) => (columnMap.get(o.id) ?? 0) === c)) break;
			span++;
		}

		result.set(event.id, { column: col, totalColumns, span });
	}

	return result;
}

// ============================================================
// コンポーネント
// ============================================================

interface TimelineViewProps {
	events: UICalendarEvent[];
	currentTime: Date;
}

/**
 * 時刻ラベルのフォーマット
 */
function formatHourLabel(hour: number): string {
	return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * イベントのY座標と高さを計算
 */
function getEventPosition(event: UICalendarEvent): {
	top: number;
	height: number;
} {
	const startHour =
		event.startTime.getHours() + event.startTime.getMinutes() / 60;
	const rawEndHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;
	// 深夜跨ぎ（例: 23:00→翌01:00）の場合、表示範囲の終端まで描画する
	const endHour = rawEndHour < startHour ? DAY_END_HOUR : rawEndHour;

	const clampedStart = Math.max(startHour, DAY_START_HOUR);
	const clampedEnd = Math.min(endHour, DAY_END_HOUR);

	const top = (clampedStart - DAY_START_HOUR) * HOUR_HEIGHT;
	const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 24);

	return { top, height };
}

/**
 * タイムラインビューコンポーネント
 *
 * 時間軸に沿ってイベントをブロック表示するビューです。
 * 終日イベントは上部に別セクションとして表示します。
 * 現在時刻のインジケータ（赤い線）も表示されます。
 * 重複するイベントは横並びで表示されます。
 *
 * 注意: 複雑な絶対配置レイアウトのため、一部のスタイルは
 * style prop で直接指定しています（動的な top/height/left/width 値）。
 */
export function TimelineView({ events, currentTime }: TimelineViewProps) {
	// タイムライングリッドの幅を取得
	const [containerWidth, setContainerWidth] = useState(0);

	const handleLayout = useCallback(
		(e: { nativeEvent: { layout: { width: number } } }) => {
			setContainerWidth(e.nativeEvent.layout.width);
		},
		[],
	);

	// 終日でないイベントのうち、表示時間帯と重なるもののみ表示する
	const timeEvents = events.filter((e) => {
		if (e.isAllDay) return false;
		const startHour = e.startTime.getHours() + e.startTime.getMinutes() / 60;
		const rawEndHour = e.endTime.getHours() + e.endTime.getMinutes() / 60;
		// 深夜跨ぎの場合、表示範囲の終端まで表示する
		const endHour = rawEndHour < startHour ? DAY_END_HOUR : rawEndHour;
		return endHour > DAY_START_HOUR && startHour < DAY_END_HOUR;
	});
	const allDayEvents = events.filter((e) => e.isAllDay);

	// 重複イベントの列レイアウトを計算
	const columnLayoutMap = useMemo(
		() => calculateColumnLayout(timeEvents),
		[timeEvents],
	);

	const hours = Array.from(
		{ length: DAY_END_HOUR - DAY_START_HOUR },
		(_, i) => DAY_START_HOUR + i,
	);

	// 現在時刻のインジケータ位置
	const now = currentTime.getHours() + currentTime.getMinutes() / 60;
	// DAY_END_HOUR丁度ではコンテナ境界にはみ出すため厳密な不等号を使用
	const showIndicator = now >= DAY_START_HOUR && now < DAY_END_HOUR;
	const indicatorTop = (now - DAY_START_HOUR) * HOUR_HEIGHT;

	// イベント描画に使える横幅
	const availableWidth = containerWidth - EVENT_LEFT_OFFSET - PADDING_RIGHT;

	return (
		<View>
			{/* 終日イベントセクション */}
			{allDayEvents.length > 0 && (
				<View className="border-b border-bg-muted bg-bg-subtle px-4 py-2">
					<Text className="mb-1 text-xs text-fg-muted">終日</Text>
					{allDayEvents.map((event) => (
						<View
							key={event.id}
							className="mb-1 rounded-md px-2 py-1.5"
							style={{
								backgroundColor: `${event.color ?? DEFAULT_CALENDAR_COLOR}20`,
								borderLeftWidth: 3,
								borderLeftColor: event.color ?? DEFAULT_CALENDAR_COLOR,
							}}
						>
							<Text
								className="text-[13px] font-medium text-fg"
								numberOfLines={1}
							>
								{event.title}
							</Text>
						</View>
					))}
				</View>
			)}

			{/* タイムライングリッド */}
			<View
				className="relative mt-2"
				style={{ height: hours.length * HOUR_HEIGHT }}
				onLayout={handleLayout}
			>
				{/* 時刻ラベルとグリッド線 */}
				{hours.map((hour) => (
					<View
						key={hour}
						className="absolute left-0 right-0 flex-row items-start"
						style={{ top: (hour - DAY_START_HOUR) * HOUR_HEIGHT }}
					>
						<Text
							className="text-right text-[11px] text-fg-subtle"
							style={{
								width: TIME_LABEL_WIDTH,
								paddingRight: 8,
								marginTop: -6,
							}}
						>
							{formatHourLabel(hour)}
						</Text>
						<View className="h-px flex-1 bg-bg-muted" />
					</View>
				))}

				{/* 現在時刻インジケータ */}
				{showIndicator && (
					<View
						className="absolute right-0 z-10 flex-row items-center"
						style={{ top: indicatorTop, left: TIME_LABEL_WIDTH - 4 }}
					>
						<View className="h-2 w-2 rounded-full bg-red-500" />
						<View className="h-0.5 flex-1 bg-red-500" />
					</View>
				)}

				{/* イベントブロック（コンテナ幅が確定してから描画） */}
				{containerWidth > 0 &&
					timeEvents.map((event) => {
						const { top, height } = getEventPosition(event);
						const eventColor = event.color ?? DEFAULT_CALENDAR_COLOR;
						const layout = columnLayoutMap.get(event.id) ?? {
							column: 0,
							totalColumns: 1,
							span: 1,
						};
						const columnWidth = availableWidth / layout.totalColumns;
						const eventLeft = EVENT_LEFT_OFFSET + layout.column * columnWidth;
						const eventWidth = columnWidth * layout.span - COLUMN_GAP;

						return (
							<View
								key={event.id}
								className="absolute rounded-md px-2 py-1"
								style={{
									top,
									height,
									left: eventLeft,
									width: eventWidth,
									backgroundColor: `${eventColor}20`,
									borderLeftWidth: 3,
									borderLeftColor: eventColor,
								}}
							>
								<Text className="text-[10px] text-fg-muted" numberOfLines={1}>
									{event.startTime.toLocaleTimeString("ja-JP", {
										hour: "2-digit",
										minute: "2-digit",
										hour12: false,
									})}
								</Text>
								<Text className="text-xs font-medium text-fg" numberOfLines={2}>
									{event.title}
								</Text>
							</View>
						);
					})}
			</View>
		</View>
	);
}
