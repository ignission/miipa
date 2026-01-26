/**
 * SoloDay Mastra ツール集
 *
 * このファイルはSoloDayエージェントで使用するツールをエクスポートします。
 * ツールはMastraフレームワークの createTool を使用して定義します。
 *
 * 今後追加予定のツール:
 * - getCalendarEvents: カレンダーイベントを取得
 * - getTodaySummary: 今日の予定サマリーを生成
 * - getWeekSummary: 今週の予定サマリーを生成
 * - findFreeSlots: 空き時間を検索
 */

// ツールのプレースホルダーエクスポート
// 実際のツールは後続タスクで実装予定

/**
 * 全ツールをまとめたオブジェクト
 * Agentのtoolsプロパティにそのまま渡せる形式
 */
export const solodayTools = {
	// 後続タスクでツールを追加
	// 例:
	// getCalendarEvents,
	// getTodaySummary,
};

/**
 * ツール追加時の手順:
 *
 * 1. lib/mastra/tools/ 配下に新しいツールファイルを作成
 *    例: calendar-tool.ts
 *
 * 2. createTool を使用してツールを定義
 *    - id: ツールの一意識別子
 *    - description: ツールの説明（エージェントがツール選択に使用）
 *    - inputSchema: Zodスキーマで入力を定義
 *    - outputSchema: Zodスキーマで出力を定義
 *    - execute: 実際の処理を実装
 *
 * 3. このファイルでエクスポート
 *
 * 4. src/mastra/agents/soloday-agent.ts の tools に追加
 */
