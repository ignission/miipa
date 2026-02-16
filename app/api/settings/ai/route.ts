/**
 * AI設定 API エンドポイント
 *
 * LLMプロバイダ設定の取得・更新を行います。
 * Auth.js認証チェック後、D1コンテキストを使用して設定を操作します。
 *
 * @endpoint GET /api/settings/ai
 * @endpoint PUT /api/settings/ai
 */

import { type NextRequest, NextResponse } from "next/server";
import { saveSetupSettings } from "@/lib/application/setup";
import type { SetupSettings } from "@/lib/application/setup/types";
import { getSecretKeyForProvider } from "@/lib/application/setup/types";
import { isLLMProvider, type LLMProvider } from "@/lib/config/types";
import { isErr, isOk } from "@/lib/domain/shared/result";
import { createAuthenticatedContext } from "@/lib/infrastructure/cloudflare/api-context";

/**
 * AI設定更新リクエストボディ
 */
interface UpdateAISettingsRequest {
	/** LLMプロバイダ識別子 */
	readonly provider?: string;
	/** APIキー（Claude/OpenAI用） */
	readonly apiKey?: string;
	/** OllamaのベースURL */
	readonly baseUrl?: string;
	/** 使用するモデル名 */
	readonly model?: string;
}

/**
 * 現在のAI設定を取得する
 *
 * - プロバイダ設定をD1から取得
 * - APIキーの有無を確認（キー自体は返さない）
 * - モデル名・ベースURLを取得（設定されている場合）
 *
 * @returns プロバイダ、APIキー有無、モデル、ベースURLのレスポンス
 */
export async function GET() {
	// 認証済みコンテキスト取得
	const ctxResult = await createAuthenticatedContext();
	if (isErr(ctxResult)) {
		return NextResponse.json(
			{
				error: { code: ctxResult.error.code, message: ctxResult.error.message },
			},
			{ status: ctxResult.error.status },
		);
	}
	const { calendarCtx } = ctxResult.value;

	// プロバイダ設定を取得
	const providerResult =
		await calendarCtx.configRepository.getSetting("llm_provider");
	if (isErr(providerResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "プロバイダ設定の取得に失敗しました",
				},
			},
			{ status: 500 },
		);
	}

	const rawProvider = providerResult.value;
	const provider: LLMProvider | null = isLLMProvider(rawProvider)
		? rawProvider
		: null;

	// APIキーの有無を確認
	let hasApiKey = false;
	if (provider) {
		const secretKey = getSecretKeyForProvider(provider);
		const hasKeyResult =
			await calendarCtx.secretRepository.hasSecret(secretKey);
		if (isOk(hasKeyResult)) {
			hasApiKey = hasKeyResult.value;
		}
	}

	// モデル名を取得
	const modelResult =
		await calendarCtx.configRepository.getSetting("llm_model");
	const model = isOk(modelResult) ? modelResult.value : null;

	// ベースURLを取得
	const baseUrlResult =
		await calendarCtx.configRepository.getSetting("llm_base_url");
	const baseUrl = isOk(baseUrlResult) ? baseUrlResult.value : null;

	return NextResponse.json({
		provider,
		hasApiKey,
		...(model && { model }),
		...(baseUrl && { baseUrl }),
	});
}

/**
 * AI設定を更新する
 *
 * - プロバイダのバリデーション
 * - saveSetupSettingsで設定を保存（既存キーは上書き）
 *
 * @param request - リクエストオブジェクト
 * @returns 更新結果
 */
export async function PUT(request: NextRequest) {
	// 認証済みコンテキスト取得
	const ctxResult = await createAuthenticatedContext();
	if (isErr(ctxResult)) {
		return NextResponse.json(
			{
				error: { code: ctxResult.error.code, message: ctxResult.error.message },
			},
			{ status: ctxResult.error.status },
		);
	}
	const { calendarCtx } = ctxResult.value;

	// リクエストボディのパース
	let body: UpdateAISettingsRequest;
	try {
		body = (await request.json()) as UpdateAISettingsRequest;
	} catch {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのJSONパースに失敗しました",
				},
			},
			{ status: 400 },
		);
	}

	// プロバイダのバリデーション
	if (!body.provider || !isLLMProvider(body.provider)) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "有効なプロバイダが指定されていません",
				},
			},
			{ status: 400 },
		);
	}

	// SetupSettings型に変換
	const settings: SetupSettings = {
		provider: body.provider,
		apiKey: body.apiKey,
		baseUrl: body.baseUrl,
		model: body.model,
	};

	const result = await saveSetupSettings(calendarCtx, settings, {
		overwriteExisting: true,
	});

	if (isOk(result)) {
		return NextResponse.json({ success: true });
	}

	return NextResponse.json(
		{
			success: false,
			error: { code: result.error.code, message: result.error.message },
		},
		{ status: 500 },
	);
}
