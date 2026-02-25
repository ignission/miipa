/**
 * ViewTabsコンポーネント
 *
 * 「今日」「今週」「月」の3つの表示切替タブを提供します。
 * Web版の Panda CSS + SVG アイコン実装から
 * NativeWind + React Native Pressable に移行しています。
 *
 * @module components/calendar/view-tabs
 *
 * @example
 * ```tsx
 * <ViewTabs
 *   activeView="today"
 *   onViewChange={(view) => setActiveView(view)}
 * />
 * ```
 */

import { Pressable, Text, View } from "react-native";

/**
 * ビュータイプ
 */
export type ViewType = "today" | "week" | "month";

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
const TABS: { id: ViewType; label: string; icon: string }[] = [
	{ id: "today", label: "今日", icon: "☀️" },
	{ id: "week", label: "今週", icon: "📅" },
	{ id: "month", label: "月", icon: "📆" },
];

/**
 * ビュー切替タブコンポーネント
 *
 * 「今日」「今週」「月」の3つの表示を切り替えるためのタブUIを提供します。
 *
 * @param props - コンポーネントのProps
 * @param props.activeView - 現在アクティブなビュー（'today' | 'week' | 'month'）
 * @param props.onViewChange - ビュー変更時のコールバック
 * @returns タブ要素
 */
export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
	return (
		<View
			className="flex-row items-center gap-2 rounded-2xl border border-border bg-bg-subtle p-1.5"
			accessibilityRole="tablist"
			accessibilityLabel="予定表示期間の選択"
		>
			{TABS.map((tab) => {
				const isActive = activeView === tab.id;

				return (
					<Pressable
						key={tab.id}
						className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 ${
							isActive ? "bg-bg shadow-sm" : "bg-transparent active:bg-bg-muted"
						}`}
						onPress={() => onViewChange(tab.id)}
						accessibilityRole="tab"
						accessibilityState={{ selected: isActive }}
						accessibilityLabel={tab.label}
					>
						<Text className="text-base">{tab.icon}</Text>
						<Text
							className={`text-base font-semibold ${
								isActive ? "text-fg" : "text-fg-muted"
							}`}
						>
							{tab.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
