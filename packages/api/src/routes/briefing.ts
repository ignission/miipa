/**
 * ブリーフィング Hono ルート
 *
 * 今日の予定サマリーとAI生成の挨拶文を返します。
 * カレンダーイベントを取得し、構造化データに変換して返却します。
 *
 * GET /briefing - BriefingResponse JSON を返却
 */

import { Hono } from "hono";
import type { AppType } from "@/context/app-context";
import { resolveLLMProvider } from "@/lib/ai/model-resolver";
import {
	buildBriefing,
	getOrGenerateGreeting,
} from "@/lib/application/briefing";
import { getEventsForToday } from "@/lib/application/calendar";
import { getOAuthConfig } from "@/lib/auth/oauth-config";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

// ============================================================
// ルート定義
// ============================================================

const briefing = new Hono<AppType>();

/**
 * GET /briefing - 今日のブリーフィングを取得
 *
 * 今日のカレンダーイベントから構造化ブリーフィングデータを生成し、
 * AI生成の挨拶文を付加して返します。
 */
briefing.get("/", async (c) => {
	const db = c.get("db");
	const userId = c.get("userId");
	const encryptionKeyBase64 = c.get("encryptionKey");

	// Base64文字列 -> CryptoKey に変換
	const cryptoKeyResult = await importEncryptionKey(encryptionKeyBase64);
	if (!isOk(cryptoKeyResult)) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	// カレンダーコンテキスト作成
	const oauthConfig = getOAuthConfig(c.env);
	const ctx = createCalendarContext(
		db,
		userId,
		cryptoKeyResult.value,
		oauthConfig,
	);

	// 今日のイベントを取得
	const eventsResult = await getEventsForToday(ctx);
	if (!isOk(eventsResult)) {
		return c.json(
			{
				error: {
					code: eventsResult.error.code,
					message: eventsResult.error.message,
				},
			},
			500,
		);
	}

	const events = eventsResult.value;
	const now = new Date();

	// ブリーフィングデータを構築（純粋関数）
	const briefingData = buildBriefing(events, now);

	// AI挨拶文を取得（キャッシュ優先、失敗時null）
	let greeting: string | null = null;
	const providerResult = await resolveLLMProvider(ctx);
	if (isOk(providerResult)) {
		greeting = await getOrGenerateGreeting(
			db,
			userId,
			providerResult.value,
			briefingData,
			now,
		);
	}

	return c.json({
		date: briefingData.date,
		eventCount: briefingData.eventCount,
		nextEvent: briefingData.nextEvent,
		importantEvents: briefingData.importantEvents,
		freeTimeMinutes: briefingData.freeTimeMinutes,
		allDayEvents: briefingData.allDayEvents,
		greeting,
	});
});

export { briefing };
