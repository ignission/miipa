"use client";

/**
 * ViewTabsコンポーネント
 *
 * 「今日」「今週」の表示切替タブを提供します。
 * アクセシビリティ対応（role="tablist", role="tab"）とキーボードナビゲーションをサポートしています。
 *
 * @module components/calendar/ViewTabs
 *
 * @example
 * ```tsx
 * <ViewTabs
 *   activeView="today"
 *   onViewChange={(view) => setActiveView(view)}
 * />
 * ```
 */

import { useCallback, useRef } from "react";
import { css, cx } from "@/styled-system/css";

/**
 * ビュータイプ
 */
export type ViewType = "today" | "week";

/**
 * ViewTabsコンポーネントのProps
 */
export interface ViewTabsProps {
	/** 現在アクティブなビュー */
	activeView: ViewType;
	/** ビュー変更時のコールバック */
	onViewChange: (view: ViewType) => void;
}

/** ベースのアイコンスタイル */
const iconBaseStyle = css({
	flexShrink: 0,
	transition: "transform 0.3s ease",
});

/** アクティブ時の太陽アイコンスタイル */
const sunActiveStyle = css({
	transform: "rotate(45deg)",
});

/** アクティブ時のカレンダーアイコンスタイル */
const calendarActiveStyle = css({
	transform: "scale(1.1)",
});

/**
 * 太陽アイコン（今日用）
 */
function SunIcon({ isActive }: { isActive: boolean }) {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={cx(iconBaseStyle, isActive && sunActiveStyle)}
		>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>
	);
}

/**
 * カレンダーアイコン（今週用）
 */
function CalendarIcon({ isActive }: { isActive: boolean }) {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={cx(iconBaseStyle, isActive && calendarActiveStyle)}
		>
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" />
			<line x1="3" y1="10" x2="21" y2="10" />
			<rect
				x="7"
				y="14"
				width="3"
				height="3"
				fill="currentColor"
				stroke="none"
			/>
		</svg>
	);
}

/**
 * タブ定義
 */
const TABS: { id: ViewType; label: string; Icon: typeof SunIcon }[] = [
	{ id: "today", label: "今日", Icon: SunIcon },
	{ id: "week", label: "今週", Icon: CalendarIcon },
];

/** タブボタンの基本スタイル */
const tabBaseStyle = css({
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	gap: "2.5",
	px: "6",
	py: "3",
	minWidth: "120px",
	borderRadius: "xl",
	fontSize: "md",
	fontWeight: "semibold",
	cursor: "pointer",
	transition: "all 0.2s ease",
	border: "none",
	userSelect: "none",
	// フォーカス状態 - 視認性の高いフォーカスリング（最低3px、コントラスト比3:1以上）
	_focusVisible: {
		outline: "3px solid",
		outlineColor: "neutral.9",
		outlineOffset: "2px",
	},
	// アクティブ押下時
	_active: {
		transform: "scale(0.98)",
	},
});

/** アクティブタブのスタイル */
const tabActiveStyle = css({
	bg: "bg.default",
	color: "fg.default",
	boxShadow: "sm",
	transform: "scale(1)",
});

/** 非アクティブタブのスタイル */
const tabInactiveStyle = css({
	bg: "transparent",
	color: "fg.muted",
	_hover: {
		color: "fg.default",
		bg: "bg.subtle",
		transform: "scale(1.02)",
	},
});

/**
 * ビュー切替タブコンポーネント
 *
 * 「今日」と「今週」の表示を切り替えるためのタブUIを提供します。
 * WAI-ARIA準拠のアクセシビリティ対応とキーボードナビゲーション（左右矢印キー）をサポートしています。
 *
 * @param props - コンポーネントのProps
 * @param props.activeView - 現在アクティブなビュー（'today' | 'week'）
 * @param props.onViewChange - ビュー変更時のコールバック
 * @returns タブ要素
 */
export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
	const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

	/**
	 * キーボードナビゲーション処理
	 * 左右矢印キーでタブ間を移動
	 */
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
			let newIndex: number | null = null;

			switch (event.key) {
				case "ArrowLeft":
					event.preventDefault();
					newIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1;
					break;
				case "ArrowRight":
					event.preventDefault();
					newIndex = currentIndex === TABS.length - 1 ? 0 : currentIndex + 1;
					break;
				case "Home":
					event.preventDefault();
					newIndex = 0;
					break;
				case "End":
					event.preventDefault();
					newIndex = TABS.length - 1;
					break;
				default:
					return;
			}

			if (newIndex !== null) {
				const newTab = TABS[newIndex];
				onViewChange(newTab.id);
				tabRefs.current[newIndex]?.focus();
			}
		},
		[onViewChange],
	);

	return (
		<div
			role="tablist"
			aria-label="予定表示期間の選択"
			className={css({
				display: "inline-flex",
				alignItems: "center",
				gap: "2",
				p: "1.5",
				borderRadius: "2xl",
				bg: "bg.subtle",
				border: "1px solid",
				borderColor: "border.default",
				boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
			})}
		>
			{TABS.map((tab, index) => {
				const isActive = activeView === tab.id;
				const { Icon } = tab;

				return (
					<button
						key={tab.id}
						ref={(el) => {
							tabRefs.current[index] = el;
						}}
						type="button"
						role="tab"
						id={`tab-${tab.id}`}
						aria-selected={isActive}
						aria-controls={`tabpanel-${tab.id}`}
						tabIndex={isActive ? 0 : -1}
						onClick={() => onViewChange(tab.id)}
						onKeyDown={(e) => handleKeyDown(e, index)}
						className={cx(
							tabBaseStyle,
							isActive ? tabActiveStyle : tabInactiveStyle,
						)}
					>
						<Icon isActive={isActive} />
						<span>{tab.label}</span>
					</button>
				);
			})}
		</div>
	);
}
