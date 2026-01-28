/**
 * セットアップ状態確認 API エンドポイント
 *
 * アプリケーションのセットアップ状態を取得します。
 * 設定ファイルの存在、プロバイダ設定、APIキーの有無を確認し返却します。
 *
 * @endpoint GET /api/setup/check-status
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/setup/check-status');
 * const data = await response.json();
 *
 * // 成功レスポンス
 * // {
 * //   isComplete: true,
 * //   currentProvider: 'claude',
 * //   hasApiKey: true
 * // }
 *
 * // エラーレスポンス (500)
 * // {
 * //   error: { code: 'CONFIG_PARSE_ERROR', message: '設定ファイルの読み込みに失敗しました' }
 * // }
 * ```
 */

import { NextResponse } from "next/server";
import { checkSetupStatus } from "@/lib/application/setup";
import { isErr, isOk } from "@/lib/domain/shared";
import { initializeDatabase } from "@/lib/infrastructure/db";

/**
 * セットアップ状態を取得する
 *
 * @returns セットアップ状態（isComplete, currentProvider, hasApiKey）
 */
export async function GET() {
	// データベースを初期化
	const dbResult = initializeDatabase();
	if (isErr(dbResult)) {
		return NextResponse.json(
			{
				error: {
					code: "DATABASE_ERROR",
					message: `データベースの初期化に失敗しました: ${dbResult.error.message}`,
				},
			},
			{ status: 500 },
		);
	}

	const result = await checkSetupStatus();

	if (isOk(result)) {
		return NextResponse.json({
			isComplete: result.value.isComplete,
			currentProvider: result.value.currentProvider,
			hasApiKey: result.value.hasApiKey,
		});
	}

	// エラー時は500を返す
	return NextResponse.json(
		{ error: { code: result.error.code, message: result.error.message } },
		{ status: 500 },
	);
}
