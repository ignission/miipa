/**
 * SoloDay Mastra エントリーポイント
 *
 * Mastraフレームワークのメインインスタンスを定義。
 * エージェント、ワークフロー、ストレージ、ロギングを統合管理する。
 *
 * アーキテクチャ:
 * - Agent: solodayAgent（カレンダーアシスタント）
 * - Storage: LibSQL（メモリまたはファイルベース）
 * - Logger: Pino（構造化ログ）
 * - Observability: トレース収集、機密データフィルタリング
 */
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import {
	CloudExporter,
	DefaultExporter,
	Observability,
	SensitiveDataFilter,
} from "@mastra/observability";

// SoloDayエージェントをインポート
import { solodayAgent } from "./agents/soloday-agent";

/**
 * Mastraインスタンス
 *
 * SoloDayアプリケーション全体で共有されるMastraの設定。
 * 開発環境ではメモリストレージを使用し、本番環境ではファイルベースに切り替え可能。
 */
export const mastra = new Mastra({
	// 登録エージェント
	agents: { solodayAgent },

	// ワークフロー（現時点では未使用）
	// workflows: {},

	// ストレージ設定
	// 開発時はメモリ、本番時は file:~/.soloday/mastra.db を推奨
	storage: new LibSQLStore({
		id: "soloday-storage",
		url: ":memory:", // 本番: "file:../mastra.db"
	}),

	// ログ設定
	logger: new PinoLogger({
		name: "SoloDay",
		level: "info",
	}),

	// オブザーバビリティ設定
	observability: new Observability({
		configs: {
			default: {
				serviceName: "soloday",
				exporters: [
					new DefaultExporter(), // トレースをストレージに保存
					new CloudExporter(), // Mastra Cloud（MASTRA_CLOUD_ACCESS_TOKEN設定時）
				],
				spanOutputProcessors: [
					new SensitiveDataFilter(), // パスワード、トークン等を除去
				],
			},
		},
	}),
});
