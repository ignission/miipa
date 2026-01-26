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
import { css } from "@/styled-system/css";

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

/**
 * タブ定義
 */
const TABS: { id: ViewType; label: string }[] = [
	{ id: "today", label: "今日" },
	{ id: "week", label: "今週" },
];

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
				gap: "1",
				p: "1",
				borderRadius: "lg",
				bg: "bg.muted",
				border: "1px solid",
				borderColor: "border.default",
			})}
		>
			{TABS.map((tab, index) => {
				const isActive = activeView === tab.id;

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
						className={css({
							px: "4",
							py: "2",
							borderRadius: "md",
							fontSize: "sm",
							fontWeight: "medium",
							cursor: "pointer",
							transition: "all 0.2s",
							border: "none",
							outline: "none",

							// アクティブ状態
							...(isActive
								? {
										bg: "bg.default",
										color: "fg.default",
										boxShadow: "sm",
									}
								: {
										bg: "transparent",
										color: "fg.muted",
										_hover: {
											color: "fg.default",
											bg: "bg.subtle",
										},
									}),

							// フォーカス状態
							_focusVisible: {
								outline: "2px solid",
								outlineColor: "accent.default",
								outlineOffset: "2px",
							},
						})}
					>
						{tab.label}
					</button>
				);
			})}
		</div>
	);
}
