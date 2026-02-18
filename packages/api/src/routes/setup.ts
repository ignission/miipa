/**
 * セットアップ関連 Hono ルート
 *
 * アプリケーションのセットアップ状態確認、設定保存、
 * APIキー検証を提供します。
 *
 * 対応元:
 * - app/api/setup/check-status/route.ts  → GET /setup/status
 * - app/api/setup/save-settings/route.ts → POST /setup/settings
 * - app/api/setup/validate-key/route.ts  → POST /setup/validate-key
 */

import { Hono } from "hono";
import type { AppType } from "@/context/app-context";
import {
	type SaveOptions,
	type SetupSettings,
	saveSetupSettings,
	validateApiKey,
} from "@/lib/application/setup";
import { buildCalendarContext } from "@/lib/context/build-calendar-context";
import { isOk } from "@/lib/domain/shared/result";

// ============================================================
// 型定義
// ============================================================

/** 設定保存リクエストボディ */
interface SaveSettingsRequest extends SetupSettings {
	/** 既存のAPIキーを上書きするかどうか */
	overwriteExisting?: boolean;
}

/** APIキー検証リクエストボディ */
interface ValidateKeyRequest {
	/** LLMプロバイダ */
	provider: "claude" | "openai" | "ollama";
	/** APIキー（Ollamaの場合は baseUrl） */
	apiKey: string;
}

// ============================================================
// ルート定義
// ============================================================

const setup = new Hono<AppType>();

// ============================================================
// GET /setup/status - セットアップ状態確認
// ============================================================

setup.get("/status", async (c) => {
	const ctx = await buildCalendarContext(
		c.get("db"),
		c.get("userId"),
		c.get("encryptionKey"),
	);
	if (!ctx) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	// プロバイダ設定を確認
	const providerResult = await ctx.configRepository.getSetting("llm_provider");
	if (!isOk(providerResult)) {
		return c.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "設定の取得に失敗しました",
				},
			},
			500,
		);
	}
	const currentProvider = providerResult.value ?? undefined;

	// APIキーの存在確認
	let hasApiKey = false;
	if (currentProvider) {
		const secretKey = `llm-api-key:${currentProvider}`;
		const hasKeyResult = await ctx.secretRepository.hasSecret(secretKey);
		if (isOk(hasKeyResult)) {
			hasApiKey = hasKeyResult.value;
		}
	}

	// カレンダー数の確認
	const calendarsResult = await ctx.configRepository.getSetting("calendars");
	const calendarCount =
		isOk(calendarsResult) && calendarsResult.value
			? (JSON.parse(calendarsResult.value) as unknown[]).length
			: 0;

	const isComplete = !!currentProvider && hasApiKey;

	return c.json({
		isComplete,
		currentProvider,
		hasApiKey,
		calendarCount,
	});
});

// ============================================================
// POST /setup/settings - 設定保存
// ============================================================

setup.post("/settings", async (c) => {
	const ctx = await buildCalendarContext(
		c.get("db"),
		c.get("userId"),
		c.get("encryptionKey"),
	);
	if (!ctx) {
		return c.json(
			{
				success: false,
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	let body: SaveSettingsRequest;
	try {
		body = (await c.req.json()) as SaveSettingsRequest;
	} catch {
		return c.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "不正なリクエスト形式です",
				},
			},
			400,
		);
	}

	// 必須パラメータのバリデーション
	if (!body.provider) {
		return c.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "プロバイダが指定されていません",
				},
			},
			400,
		);
	}

	// SetupSettings 型に変換（overwriteExisting は除外）
	const setupSettings: SetupSettings = {
		provider: body.provider,
		apiKey: body.apiKey,
		baseUrl: body.baseUrl,
		model: body.model,
	};

	// 保存オプション
	const options: SaveOptions = {
		overwriteExisting: body.overwriteExisting ?? false,
	};

	const result = await saveSetupSettings(ctx, setupSettings, options);

	if (isOk(result)) {
		return c.json({ success: true });
	}

	// KEY_EXISTS の場合は確認を要求（200で返す）
	if (result.error.code === "KEY_EXISTS") {
		return c.json({
			success: false,
			requiresConfirmation: true,
			error: { code: result.error.code, message: result.error.message },
		});
	}

	// その他のエラーは500を返す
	return c.json(
		{
			success: false,
			error: { code: result.error.code, message: result.error.message },
		},
		500,
	);
});

// ============================================================
// POST /setup/validate-key - APIキー検証
// ============================================================

setup.post("/validate-key", async (c) => {
	let body: ValidateKeyRequest;
	try {
		body = (await c.req.json()) as ValidateKeyRequest;
	} catch {
		return c.json(
			{
				valid: false,
				error: {
					code: "INVALID_REQUEST",
					message: "不正なリクエスト形式です",
				},
			},
			400,
		);
	}

	// 必須パラメータのバリデーション
	if (!body.provider || !body.apiKey) {
		return c.json(
			{
				valid: false,
				error: {
					code: "INVALID_REQUEST",
					message: "必須パラメータが不足しています",
				},
			},
			400,
		);
	}

	const result = await validateApiKey(body.provider, body.apiKey);

	if (isOk(result)) {
		return c.json({ valid: true });
	}

	// 検証失敗時（200で返す。クライアント側で valid: false を判定）
	return c.json({
		valid: false,
		error: { code: result.error.code, message: result.error.message },
	});
});

export { setup };
