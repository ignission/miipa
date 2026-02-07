/**
 * APIキー検証 API エンドポイント
 *
 * LLMプロバイダのAPIキーが有効かどうかを検証します。
 * Claude/OpenAIの場合は実際にAPIを呼び出して認証を確認します。
 * Ollamaの場合はサーバーへの接続確認を行います。
 *
 * @endpoint POST /api/setup/validate-key
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/setup/validate-key', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     provider: 'claude',
 *     apiKey: 'sk-ant-xxx'
 *   })
 * });
 *
 * // 成功レスポンス
 * // { valid: true }
 *
 * // 検証失敗レスポンス
 * // {
 * //   valid: false,
 * //   error: { code: 'API_ERROR', message: 'APIキーが無効です' }
 * // }
 *
 * // バリデーションエラー (400)
 * // {
 * //   valid: false,
 * //   error: { code: 'INVALID_REQUEST', message: '必須パラメータが不足しています' }
 * // }
 * ```
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateApiKey } from "@/lib/application/setup";
import { isOk } from "@/lib/domain/shared";

/**
 * APIキー検証リクエストボディ
 */
interface ValidateKeyRequest {
	/** LLMプロバイダ */
	provider: "claude" | "openai" | "ollama";
	/** APIキー（Ollamaの場合はbaseUrl） */
	apiKey: string;
}

/**
 * APIキーを検証する
 *
 * @param request - リクエストオブジェクト
 * @returns 検証結果（valid: true/false, error?: エラー情報）
 */
export async function POST(request: NextRequest) {
	// 認証チェック
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json(
			{
				error: {
					code: "UNAUTHORIZED",
					message: "認証が必要です",
				},
			},
			{ status: 401 },
		);
	}

	const body = (await request.json()) as ValidateKeyRequest;

	// 必須パラメータのバリデーション
	if (!body.provider || !body.apiKey) {
		return NextResponse.json(
			{
				valid: false,
				error: {
					code: "INVALID_REQUEST",
					message: "必須パラメータが不足しています",
				},
			},
			{ status: 400 },
		);
	}

	const result = await validateApiKey(body.provider, body.apiKey);

	if (isOk(result)) {
		return NextResponse.json({ valid: true });
	}

	// 検証失敗時（200で返す。クライアント側で valid: false を判定）
	return NextResponse.json({
		valid: false,
		error: { code: result.error.code, message: result.error.message },
	});
}
