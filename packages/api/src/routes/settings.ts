/**
 * 設定関連 Hono ルート
 *
 * AI設定（LLMプロバイダ）とチャット設定（送信キー）の
 * 取得・更新を提供します。
 *
 * 対応元:
 * - app/api/settings/ai/route.ts   → GET /settings/ai, PUT /settings/ai
 * - app/api/settings/chat/route.ts → GET /settings/chat, PUT /settings/chat
 */

import { Hono } from "hono";
import type { AppType } from "@/context/app-context";
import { saveSetupSettings } from "@/lib/application/setup";
import type { SetupSettings } from "@/lib/application/setup/types";
import { getSecretKeyForProvider } from "@/lib/application/setup/types";
import { isLLMProvider, type LLMProvider } from "@/lib/config/types";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isErr, isOk } from "@/lib/domain/shared/result";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

// ============================================================
// 型定義
// ============================================================

/** AI設定更新リクエストボディ */
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

/** 送信キーの設定値 */
type SendKey = "enter" | "cmd+enter";

/** デフォルトの送信キー */
const DEFAULT_SEND_KEY: SendKey = "enter";

/** 許可される送信キーの値 */
const VALID_SEND_KEYS: readonly SendKey[] = ["enter", "cmd+enter"];

/** チャット設定更新リクエストボディ */
interface UpdateChatSettingsRequest {
	/** 送信キー設定 */
	readonly sendKey?: string;
}

// ============================================================
// ヘルパー
// ============================================================

/**
 * 値が有効な送信キーかどうかを判定する
 *
 * @param value - 判定対象の値
 * @returns 有効な送信キーの場合は true
 */
function isSendKey(value: string | null | undefined): value is SendKey {
	return VALID_SEND_KEYS.includes(value as SendKey);
}

/**
 * encryptionKey (Base64文字列) を CryptoKey に変換して CalendarContext を構築
 * 失敗時は null を返す
 */
async function buildCalendarContext(
	db: D1Database,
	userId: string,
	encryptionKeyBase64: string,
) {
	const cryptoKeyResult = await importEncryptionKey(encryptionKeyBase64);
	if (!isOk(cryptoKeyResult)) {
		return null;
	}
	return createCalendarContext(db, userId, cryptoKeyResult.value);
}

// ============================================================
// ルート定義
// ============================================================

const settings = new Hono<AppType>();

// ============================================================
// GET /settings/ai - 現在のAI設定を取得
// ============================================================

settings.get("/ai", async (c) => {
	const calendarCtx = await buildCalendarContext(
		c.get("db"),
		c.get("userId"),
		c.get("encryptionKey"),
	);
	if (!calendarCtx) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	// プロバイダ設定を取得
	const providerResult =
		await calendarCtx.configRepository.getSetting("llm_provider");
	if (isErr(providerResult)) {
		return c.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "プロバイダ設定の取得に失敗しました",
				},
			},
			500,
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

	return c.json({
		provider,
		hasApiKey,
		...(model && { model }),
		...(baseUrl && { baseUrl }),
	});
});

// ============================================================
// PUT /settings/ai - AI設定を更新
// ============================================================

settings.put("/ai", async (c) => {
	const calendarCtx = await buildCalendarContext(
		c.get("db"),
		c.get("userId"),
		c.get("encryptionKey"),
	);
	if (!calendarCtx) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	// リクエストボディのパース
	let body: UpdateAISettingsRequest;
	try {
		body = (await c.req.json()) as UpdateAISettingsRequest;
	} catch {
		return c.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのJSONパースに失敗しました",
				},
			},
			400,
		);
	}

	// プロバイダのバリデーション
	if (!body.provider || !isLLMProvider(body.provider)) {
		return c.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "有効なプロバイダが指定されていません",
				},
			},
			400,
		);
	}

	// SetupSettings 型に変換
	const setupSettings: SetupSettings = {
		provider: body.provider,
		apiKey: body.apiKey,
		baseUrl: body.baseUrl,
		model: body.model,
	};

	const result = await saveSetupSettings(calendarCtx, setupSettings, {
		overwriteExisting: true,
	});

	if (isOk(result)) {
		return c.json({ success: true });
	}

	return c.json(
		{
			success: false,
			error: { code: result.error.code, message: result.error.message },
		},
		500,
	);
});

// ============================================================
// GET /settings/chat - チャット送信キー設定を取得
// ============================================================

settings.get("/chat", async (c) => {
	const calendarCtx = await buildCalendarContext(
		c.get("db"),
		c.get("userId"),
		c.get("encryptionKey"),
	);
	if (!calendarCtx) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	const result = await calendarCtx.configRepository.getSetting("chat_send_key");
	if (isErr(result)) {
		return c.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "チャット送信キー設定の取得に失敗しました",
				},
			},
			500,
		);
	}

	const sendKey: SendKey = isSendKey(result.value)
		? result.value
		: DEFAULT_SEND_KEY;

	return c.json({ sendKey });
});

// ============================================================
// PUT /settings/chat - チャット送信キー設定を更新
// ============================================================

settings.put("/chat", async (c) => {
	const calendarCtx = await buildCalendarContext(
		c.get("db"),
		c.get("userId"),
		c.get("encryptionKey"),
	);
	if (!calendarCtx) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	let body: UpdateChatSettingsRequest;
	try {
		body = (await c.req.json()) as UpdateChatSettingsRequest;
	} catch {
		return c.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのJSONパースに失敗しました",
				},
			},
			400,
		);
	}

	if (!body.sendKey || !isSendKey(body.sendKey)) {
		return c.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: 'sendKeyには "enter" または "cmd+enter" を指定してください',
				},
			},
			400,
		);
	}

	const result = await calendarCtx.configRepository.setSetting(
		"chat_send_key",
		body.sendKey,
	);

	if (isOk(result)) {
		return c.json({ success: true });
	}

	return c.json(
		{
			success: false,
			error: { code: result.error.code, message: result.error.message },
		},
		500,
	);
});

export { settings };
