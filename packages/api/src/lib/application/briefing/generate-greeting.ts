/**
 * AI挨拶文生成モジュール
 *
 * ブリーフィングデータを基にLLMで挨拶文を生成し、
 * D1データベースにキャッシュします。
 * LLM呼び出しが失敗してもnullを返すgraceful degradation設計です。
 *
 * @module lib/application/briefing/generate-greeting
 */

import type { LLMProvider } from "@/lib/ai/providers/types";
import type { BriefingData } from "./build-briefing";

// ============================================================
// 定数
// ============================================================

/** キャッシュキー */
const GREETING_CACHE_KEY = "briefing_greeting";

/** JSTのオフセット（ミリ秒） */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// ============================================================
// 内部型定義
// ============================================================

/** D1キャッシュ行の型 */
interface GreetingCacheRow {
	readonly value: string;
	readonly updated_at: string;
}

// ============================================================
// メイン関数
// ============================================================

/**
 * ブリーフィング挨拶文を取得（キャッシュ優先）
 *
 * 1. D1キャッシュに当日分の挨拶があればそれを返す
 * 2. キャッシュがなければLLMで生成してキャッシュに保存
 * 3. LLM呼び出しが失敗した場合はnullを返す
 *
 * @param db - D1データベース接続
 * @param userId - ユーザーID
 * @param provider - LLMプロバイダ
 * @param briefing - ブリーフィングデータ
 * @param now - 現在時刻（テスト用に注入可能）
 * @returns 挨拶文またはnull
 */
export async function getOrGenerateGreeting(
	db: D1Database,
	userId: string,
	provider: LLMProvider,
	briefing: BriefingData,
	now: Date = new Date(),
): Promise<string | null> {
	// 1. キャッシュを確認
	const cached = await getCachedGreeting(db, userId, now);
	if (cached !== null) {
		return cached;
	}

	// 2. LLMで挨拶文を生成
	try {
		const greeting = await generateGreeting(provider, briefing);
		if (greeting) {
			// キャッシュに保存（失敗しても挨拶文は返す）
			await saveGreetingCache(db, userId, greeting).catch((e) => {
				console.warn("挨拶文キャッシュの保存に失敗しました:", e);
			});
			return greeting;
		}
		return null;
	} catch (e) {
		console.warn("挨拶文の生成に失敗しました:", e);
		return null;
	}
}

// ============================================================
// キャッシュ操作
// ============================================================

/**
 * D1からキャッシュ済み挨拶文を取得
 *
 * 同日（JST基準）のキャッシュが存在すれば返し、
 * 日付が変わっていればnullを返します。
 */
async function getCachedGreeting(
	db: D1Database,
	userId: string,
	now: Date,
): Promise<string | null> {
	try {
		const row = await db
			.prepare(
				"SELECT value, updated_at FROM user_settings WHERE user_id = ? AND key = ?",
			)
			.bind(userId, GREETING_CACHE_KEY)
			.first<GreetingCacheRow>();

		if (!row) {
			return null;
		}

		// キャッシュの日付をJST基準で確認
		const cachedDate = new Date(row.updated_at);
		if (isSameJstDate(cachedDate, now)) {
			return row.value;
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * 挨拶文をD1キャッシュに保存
 */
async function saveGreetingCache(
	db: D1Database,
	userId: string,
	greeting: string,
): Promise<void> {
	await db
		.prepare(
			`INSERT OR REPLACE INTO user_settings (user_id, key, value, updated_at)
			 VALUES (?, ?, ?, datetime('now'))`,
		)
		.bind(userId, GREETING_CACHE_KEY, greeting)
		.run();
}

// ============================================================
// LLM挨拶文生成
// ============================================================

/**
 * LLMを使って挨拶文を生成
 *
 * ブリーフィングデータを基に、100文字以内の簡潔な日本語挨拶文を生成します。
 */
async function generateGreeting(
	provider: LLMProvider,
	briefing: BriefingData,
): Promise<string | null> {
	const prompt = buildGreetingPrompt(briefing);

	const response = await provider.chat({
		messages: [{ role: "user", content: prompt }],
		systemPrompt:
			"あなたはミーアキャットのAIアシスタント「miipa」です。一人社長の予定管理をサポートしています。挨拶文のみを出力してください。他の説明は不要です。",
		maxTokens: 200,
	});

	if (response.stopReason === "error" || !response.content) {
		return null;
	}

	// 100文字に収める
	const trimmed = response.content.trim().slice(0, 100);
	return trimmed || null;
}

/**
 * 挨拶文生成用のプロンプトを構築
 */
function buildGreetingPrompt(briefing: BriefingData): string {
	const parts: string[] = [];
	parts.push(`今日は${briefing.date}です。`);
	parts.push(`予定は${briefing.eventCount}件あります。`);

	if (briefing.nextEvent) {
		const time = formatJstTime(new Date(briefing.nextEvent.startTime));
		parts.push(
			`次の予定は${time}の「${briefing.nextEvent.title}」（${briefing.nextEvent.minutesUntil}分後）です。`,
		);
	}

	if (briefing.freeTimeMinutes > 0) {
		const hours = Math.floor(briefing.freeTimeMinutes / 60);
		const mins = briefing.freeTimeMinutes % 60;
		const freeStr =
			hours > 0 ? `${hours}時間${mins > 0 ? `${mins}分` : ""}` : `${mins}分`;
		parts.push(`営業時間内の空き時間は合計${freeStr}です。`);
	}

	if (briefing.allDayEvents.length > 0) {
		const titles = briefing.allDayEvents.map((e) => e.title).join("、");
		parts.push(`終日の予定: ${titles}`);
	}

	parts.push(
		"上記の情報をもとに、100文字以内の簡潔な日本語の挨拶文を1つだけ生成してください。",
	);
	parts.push("挨拶文には今日の概要と次の予定のハイライトを含めてください。");

	return parts.join("\n");
}

// ============================================================
// ヘルパー
// ============================================================

/**
 * 2つの日付がJST基準で同日かどうかを判定
 */
function isSameJstDate(a: Date, b: Date): boolean {
	const jstA = new Date(a.getTime() + JST_OFFSET_MS);
	const jstB = new Date(b.getTime() + JST_OFFSET_MS);
	return (
		jstA.getUTCFullYear() === jstB.getUTCFullYear() &&
		jstA.getUTCMonth() === jstB.getUTCMonth() &&
		jstA.getUTCDate() === jstB.getUTCDate()
	);
}

/**
 * DateオブジェクトからJSTの「HH:MM」形式を返す
 */
function formatJstTime(date: Date): string {
	const jst = new Date(date.getTime() + JST_OFFSET_MS);
	const h = jst.getUTCHours().toString().padStart(2, "0");
	const m = jst.getUTCMinutes().toString().padStart(2, "0");
	return `${h}:${m}`;
}
