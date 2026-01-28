/**
 * 設定保存 API エンドポイント
 *
 * セットアップ設定をKeychain（APIキー）と設定ファイル（プロバイダ情報）に保存します。
 * 既存のAPIキーが存在する場合は確認を要求します。
 *
 * @endpoint POST /api/setup/save-settings
 *
 * @example
 * ```typescript
 * // リクエスト（Claude/OpenAI）
 * const response = await fetch('/api/setup/save-settings', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     provider: 'claude',
 *     apiKey: 'sk-ant-xxx'
 *   })
 * });
 *
 * // リクエスト（Ollama）
 * const response = await fetch('/api/setup/save-settings', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     provider: 'ollama',
 *     baseUrl: 'http://localhost:11434',
 *     model: 'llama2'
 *   })
 * });
 *
 * // 成功レスポンス
 * // { success: true }
 *
 * // 既存キーが存在し上書き確認が必要な場合
 * // {
 * //   success: false,
 * //   requiresConfirmation: true,
 * //   error: { code: 'KEY_EXISTS', message: '既にAPIキーが設定されています。上書きしますか？' }
 * // }
 *
 * // 上書き確認後のリクエスト
 * const response = await fetch('/api/setup/save-settings', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     provider: 'claude',
 *     apiKey: 'sk-ant-xxx',
 *     overwriteExisting: true
 *   })
 * });
 *
 * // バリデーションエラー (400)
 * // {
 * //   success: false,
 * //   error: { code: 'INVALID_REQUEST', message: 'プロバイダが指定されていません' }
 * // }
 *
 * // サーバーエラー (500)
 * // {
 * //   success: false,
 * //   error: { code: 'KEYCHAIN_ERROR', message: '認証情報の保存に失敗しました' }
 * // }
 * ```
 */

import { type NextRequest, NextResponse } from "next/server";
import {
	type SaveOptions,
	type SetupSettings,
	saveSetupSettings,
} from "@/lib/application/setup";
import { isErr, isOk } from "@/lib/domain/shared";
import { initializeDatabase } from "@/lib/infrastructure/db";

/**
 * 設定保存リクエストボディ
 */
interface SaveSettingsRequest extends SetupSettings {
	/** 既存のAPIキーを上書きするかどうか */
	overwriteExisting?: boolean;
}

/**
 * セットアップ設定を保存する
 *
 * @param request - リクエストオブジェクト
 * @returns 保存結果（success: true/false, requiresConfirmation?: boolean, error?: エラー情報）
 */
export async function POST(request: NextRequest) {
	const body = (await request.json()) as SaveSettingsRequest;

	// 必須パラメータのバリデーション
	if (!body.provider) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "プロバイダが指定されていません",
				},
			},
			{ status: 400 },
		);
	}

	// データベースを初期化
	const dbResult = initializeDatabase();
	if (isErr(dbResult)) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "DATABASE_ERROR",
					message: `データベースの初期化に失敗しました: ${dbResult.error.message}`,
				},
			},
			{ status: 500 },
		);
	}

	// SetupSettings型に変換（overwriteExistingは除外）
	const settings: SetupSettings = {
		provider: body.provider,
		apiKey: body.apiKey,
		baseUrl: body.baseUrl,
		model: body.model,
	};

	// 保存オプション
	const options: SaveOptions = {
		overwriteExisting: body.overwriteExisting ?? false,
	};

	const result = await saveSetupSettings(settings, options);

	if (isOk(result)) {
		return NextResponse.json({ success: true });
	}

	// KEY_EXISTSの場合は確認を要求（200で返す）
	if (result.error.code === "KEY_EXISTS") {
		return NextResponse.json({
			success: false,
			requiresConfirmation: true,
			error: { code: result.error.code, message: result.error.message },
		});
	}

	// その他のエラーは500を返す
	return NextResponse.json(
		{
			success: false,
			error: { code: result.error.code, message: result.error.message },
		},
		{ status: 500 },
	);
}
