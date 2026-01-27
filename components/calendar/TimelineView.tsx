"use client";

/**
 * TimelineViewコンポーネント
 *
 * タイムライン形式でイベントを表示するメインコンポーネントです。
 * 終日イベントと時間指定イベントを分離し、視覚的なタイムライン上に配置します。
 *
 * @module components/calendar/TimelineView
 *
 * @example
 * ```tsx
 * <TimelineView
 *   events={calendarEvents}
 *   currentTime={new Date()}
 *   dayStartHour={6}
 *   dayEndHour={22}
 * />
 * ```
 */

import { type InputEvent, prepareTimelineEvents } from "@/lib/utils/timeline";
import { css } from "@/styled-system/css";
import { CurrentTimeIndicator } from "./CurrentTimeIndicator";
import { EventCard } from "./EventCard";
import { TimelineEvent } from "./TimelineEvent";

// ============================================================
// 型定義
// ============================================================

/**
 * TimelineViewコンポーネントのProps
 */
export interface TimelineViewProps {
	/** イベント一覧 */
	events: InputEvent[];
	/** 現在時刻 */
	currentTime: Date;
	/** 1日の開始時刻（デフォルト: 6時） */
	dayStartHour?: number;
	/** 1日の終了時刻（デフォルト: 22時） */
	dayEndHour?: number;
}

// ============================================================
// 定数
// ============================================================

/**
 * デフォルトの1日の開始時刻
 */
const DEFAULT_DAY_START_HOUR = 6;

/**
 * デフォルトの1日の終了時刻
 */
const DEFAULT_DAY_END_HOUR = 22;

/**
 * 1時間あたりの高さ（px）
 * 30分イベントでも最低70pxの高さを確保するため、140pxに設定
 */
const HOUR_HEIGHT = 140;

/**
 * 時刻ラベルの幅（px）
 */
const TIME_LABEL_WIDTH = 60;

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * 今日の日付と指定時刻からISO 8601形式の日時文字列を生成
 *
 * @param currentTime - 基準となる現在時刻
 * @param hour - 時刻（0-24）
 * @returns ISO 8601形式の日時文字列
 */
function createDayTimeISO(currentTime: Date, hour: number): string {
	const date = new Date(currentTime);
	date.setHours(hour, 0, 0, 0);
	return date.toISOString();
}

/**
 * 時刻ラベルを生成
 *
 * @param hour - 時刻（0-24）
 * @returns "HH:00"形式の文字列
 */
function formatHourLabel(hour: number): string {
	return `${hour.toString().padStart(2, "0")}:00`;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 終日イベントセクション
 *
 * 終日イベントがある場合のみ表示されるセクションです。
 *
 * @param props - コンポーネントのProps
 * @param props.events - 終日イベントの配列
 * @returns 終日イベントセクション要素、またはnull
 */
function AllDaySection({ events }: { events: InputEvent[] }) {
	if (events.length === 0) {
		return null;
	}

	return (
		<section
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "2",
				pb: "4",
				mb: "4",
				borderBottom: "1px solid",
				borderColor: "border.subtle",
			})}
			aria-label="終日イベント"
		>
			<h3
				className={css({
					fontSize: "xs",
					fontWeight: "medium",
					color: "fg.muted",
					m: "0",
				})}
			>
				終日
			</h3>
			<div
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "2",
				})}
			>
				{events.map((event) => (
					<EventCard key={event.id} event={event} color={event.color} />
				))}
			</div>
		</section>
	);
}

/**
 * 時刻グリッドコンポーネント
 *
 * 時刻ラベルと横線を表示するグリッドです。
 *
 * @param props - コンポーネントのProps
 * @param props.startHour - 開始時刻
 * @param props.endHour - 終了時刻
 * @returns 時刻グリッド要素
 */
function TimeGrid({
	startHour,
	endHour,
}: {
	startHour: number;
	endHour: number;
}) {
	const hours = [];
	for (let hour = startHour; hour <= endHour; hour++) {
		hours.push(hour);
	}

	return (
		<div
			className={css({
				position: "absolute",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				pointerEvents: "none",
			})}
			aria-hidden="true"
		>
			{hours.map((hour, index) => (
				<div
					key={hour}
					className={css({
						position: "absolute",
						left: 0,
						right: 0,
						display: "flex",
						alignItems: "flex-start",
					})}
					style={{
						top: `${index * HOUR_HEIGHT}px`,
						height: `${HOUR_HEIGHT}px`,
					}}
				>
					{/* 時刻ラベル */}
					<span
						className={css({
							fontSize: "xs",
							color: "fg.muted",
							textAlign: "right",
							pr: "3",
							flexShrink: 0,
							transform: "translateY(-50%)",
						})}
						style={{ width: `${TIME_LABEL_WIDTH}px` }}
					>
						{formatHourLabel(hour)}
					</span>
					{/* 横線 */}
					<div
						className={css({
							flex: 1,
							borderTop: "1px solid",
							borderColor: "border.subtle",
						})}
					/>
				</div>
			))}
		</div>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * タイムラインビューコンポーネント
 *
 * タイムライン形式でカレンダーイベントを表示します。
 * 終日イベントは上部に、時間指定イベントはタイムラインに配置されます。
 *
 * @param props - コンポーネントのProps
 * @param props.events - イベント一覧
 * @param props.currentTime - 現在時刻
 * @param props.dayStartHour - 1日の開始時刻（オプション、デフォルト: 6）
 * @param props.dayEndHour - 1日の終了時刻（オプション、デフォルト: 22）
 * @returns タイムラインビュー要素
 */
export function TimelineView({
	events,
	currentTime,
	dayStartHour = DEFAULT_DAY_START_HOUR,
	dayEndHour = DEFAULT_DAY_END_HOUR,
}: TimelineViewProps) {
	// タイムライン表示用にイベントを準備
	const { allDayEvents, timedEvents } = prepareTimelineEvents(
		events,
		currentTime,
	);

	// 日時文字列を生成
	const dayStart = createDayTimeISO(currentTime, dayStartHour);
	const dayEnd = createDayTimeISO(currentTime, dayEndHour);

	// 表示時間帯の計算
	const displayHours = dayEndHour - dayStartHour;
	const totalHeight = displayHours * HOUR_HEIGHT;

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				width: "100%",
			})}
		>
			{/* 終日イベントセクション */}
			<AllDaySection events={allDayEvents} />

			{/* タイムライングリッド */}
			<div
				className={css({
					position: "relative",
					width: "100%",
				})}
				style={{ height: `${totalHeight}px` }}
			>
				{/* 時刻グリッド（背景） */}
				<TimeGrid startHour={dayStartHour} endHour={dayEndHour} />

				{/* イベント表示エリア */}
				<div
					className={css({
						position: "absolute",
						top: 0,
						bottom: 0,
						right: 0,
					})}
					style={{
						left: `${TIME_LABEL_WIDTH}px`,
					}}
				>
					{/* 現在時刻インジケーター */}
					<CurrentTimeIndicator
						currentTime={currentTime}
						dayStartHour={dayStartHour}
						dayEndHour={dayEndHour}
					/>

					{/* タイムラインイベント */}
					{timedEvents.map((event) => (
						<TimelineEvent
							key={event.id}
							event={event}
							dayStart={dayStart}
							dayEnd={dayEnd}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
