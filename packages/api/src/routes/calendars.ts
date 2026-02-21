/**
 * カレンダー関連 Hono ルート
 *
 * カレンダー一覧取得、個別カレンダー操作、Google OAuth認証、
 * iCalカレンダー追加、カレンダー同期を提供します。
 *
 * 対応元:
 * - app/api/calendars/route.ts         → GET /calendars
 * - app/api/calendars/[id]/route.ts    → DELETE /calendars/:id, PATCH /calendars/:id
 * - app/api/calendars/google/route.ts  → POST /calendars/google
 * - app/api/calendars/google/reauth/route.ts → GET /calendars/google/reauth
 * - app/api/calendars/ical/route.ts    → POST /calendars/ical
 * - app/api/calendars/sync/route.ts    → POST /calendars/sync
 */

import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { z } from "zod";
import type { AppType } from "@/context/app-context";
import {
	addICalCalendar,
	startGoogleAuth,
	syncAllCalendars,
} from "@/lib/application/calendar";
import { getOAuthConfig } from "@/lib/auth/oauth-config";
import { buildCalendarContext } from "@/lib/context/build-calendar-context";
import type { CalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import { createCalendarId } from "@/lib/domain/shared/types";

// ============================================================
// 定数・型定義
// ============================================================

/** code_verifier を保存する Cookie 名（コールバックと共通） */
const CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";

/** Cookie の有効期限（10分） */
const COOKIE_MAX_AGE = 60 * 10;

/** カレンダー設定の型 */
interface CalendarEntry {
	readonly id: string;
	readonly name: string;
	readonly enabled: boolean;
	readonly [key: string]: unknown;
}

/** PATCH リクエストの Zod スキーマ */
const patchCalendarSchema = z.object({
	enabled: z.boolean(),
});

// ============================================================
// ヘルパー
// ============================================================

/**
 * カレンダー設定一覧を取得・パース
 *
 * @returns パース済みのカレンダー配列、またはエラー情報
 */
async function getCalendarList(
	ctx: CalendarContext,
): Promise<
	| { ok: true; calendars: CalendarEntry[] }
	| { ok: false; code: string; message: string }
> {
	const settingResult = await ctx.configRepository.getSetting("calendars");
	if (!isOk(settingResult)) {
		return { ok: false, code: "DB_ERROR", message: "設定取得エラー" };
	}
	if (settingResult.value === null) {
		return { ok: true, calendars: [] };
	}
	try {
		return { ok: true, calendars: JSON.parse(settingResult.value) };
	} catch {
		return {
			ok: false,
			code: "CONFIG_PARSE_ERROR",
			message: "カレンダー設定のパースに失敗しました",
		};
	}
}

const calendars = new Hono<AppType>();

// ============================================================
// GET /calendars - カレンダー一覧取得
// ============================================================

calendars.get("/", async (c) => {
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

	const listResult = await getCalendarList(ctx);
	if (!listResult.ok) {
		return c.json(
			{ error: { code: listResult.code, message: listResult.message } },
			500,
		);
	}

	return c.json({ calendars: listResult.calendars });
});

// ============================================================
// DELETE /calendars/:id - カレンダー削除
// ============================================================

calendars.delete("/:id", async (c) => {
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

	const id = c.req.param("id");

	const listResult = await getCalendarList(ctx);
	if (!listResult.ok) {
		return c.json(
			{ error: { code: listResult.code, message: listResult.message } },
			500,
		);
	}

	// 対象のカレンダーが存在するか確認
	const exists = listResult.calendars.some((cal) => cal.id === id);
	if (!exists) {
		return c.json(
			{
				error: {
					code: "CALENDAR_NOT_FOUND",
					message: "指定されたカレンダーが見つかりません",
				},
			},
			404,
		);
	}

	// カレンダーを配列から除外して保存
	const updatedCalendars = listResult.calendars.filter((cal) => cal.id !== id);
	const saveResult = await ctx.configRepository.setSetting(
		"calendars",
		JSON.stringify(updatedCalendars),
	);
	if (!isOk(saveResult)) {
		return c.json(
			{
				error: {
					code: "CONFIG_SAVE_ERROR",
					message: "設定の保存に失敗しました",
				},
			},
			500,
		);
	}

	// キャッシュされたイベントを削除（失敗時は警告ログのみ）
	const deleteResult = await ctx.eventRepository.deleteByCalendar(
		createCalendarId(id),
	);
	if (!isOk(deleteResult)) {
		console.warn(
			`カレンダー ${id} のキャッシュイベント削除に失敗しました: ${deleteResult.error.message}`,
		);
	}

	return c.body(null, 204);
});

// ============================================================
// PATCH /calendars/:id - カレンダー有効/無効切り替え
// ============================================================

calendars.patch("/:id", async (c) => {
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

	const id = c.req.param("id");

	// リクエストボディのバリデーション
	let body: unknown;
	try {
		body = await c.req.json();
	} catch {
		return c.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのJSON形式が不正です",
				},
			},
			400,
		);
	}

	const validation = patchCalendarSchema.safeParse(body);
	if (!validation.success) {
		return c.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "enabled フィールド（boolean）が必要です",
				},
			},
			400,
		);
	}

	const { enabled } = validation.data;

	// カレンダー設定を取得
	const listResult = await getCalendarList(ctx);
	if (!listResult.ok) {
		return c.json(
			{ error: { code: listResult.code, message: listResult.message } },
			500,
		);
	}

	// 対象のカレンダーを検索
	const target = listResult.calendars.find((cal) => cal.id === id);
	if (!target) {
		return c.json(
			{
				error: {
					code: "CALENDAR_NOT_FOUND",
					message: "指定されたカレンダーが見つかりません",
				},
			},
			404,
		);
	}

	// enabled フィールドを更新
	const updatedCalendar = { ...target, enabled };
	const updatedCalendars = listResult.calendars.map((cal) =>
		cal.id === id ? updatedCalendar : cal,
	);

	const saveResult = await ctx.configRepository.setSetting(
		"calendars",
		JSON.stringify(updatedCalendars),
	);
	if (!isOk(saveResult)) {
		return c.json(
			{
				error: {
					code: "CONFIG_SAVE_ERROR",
					message: "設定の保存に失敗しました",
				},
			},
			500,
		);
	}

	return c.json({ calendar: updatedCalendar });
});

// ============================================================
// POST /calendars/google - Google OAuth認証開始
// ============================================================

calendars.post("/google", async (c) => {
	// リクエストボディからオプションの loginHint を取得（空ボディも許容）
	let loginHint: string | undefined;
	try {
		const body = (await c.req.json()) as { loginHint?: string };
		loginHint = body.loginHint;
	} catch {
		// ボディが空または不正な場合は loginHint なしで続行
	}

	const oauthConfig = getOAuthConfig(c.env);
	const result = await startGoogleAuth(oauthConfig, loginHint);

	if (isOk(result)) {
		const { url, codeVerifier } = result.value;

		// code_verifier を Cookie に保存
		setCookie(c, CODE_VERIFIER_COOKIE, codeVerifier, {
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
			maxAge: COOKIE_MAX_AGE,
			path: "/",
		});

		return c.json({ authUrl: url });
	}

	// エラー時は500を返す
	return c.json(
		{ error: { code: result.error.code, message: result.error.message } },
		500,
	);
});

// ============================================================
// GET /calendars/google/reauth - Google OAuth再認証
// ============================================================

calendars.get("/google/reauth", async (c) => {
	const email = c.req.query("email");

	// email が未指定の場合は 400 エラー
	if (!email) {
		return c.json(
			{
				error: {
					code: "MISSING_EMAIL",
					message: "email クエリパラメータは必須です",
				},
			},
			400,
		);
	}

	const oauthConfig = getOAuthConfig(c.env);
	const result = await startGoogleAuth(oauthConfig, email);

	if (isOk(result)) {
		const { url, codeVerifier } = result.value;

		// code_verifier を Cookie に保存
		setCookie(c, CODE_VERIFIER_COOKIE, codeVerifier, {
			httpOnly: true,
			secure: true,
			sameSite: "Lax",
			maxAge: COOKIE_MAX_AGE,
			path: "/",
		});

		// Google 認証画面にリダイレクト
		return c.redirect(url);
	}

	// エラー時は 500 を返す
	return c.json(
		{ error: { code: result.error.code, message: result.error.message } },
		500,
	);
});

// ============================================================
// POST /calendars/ical - iCalカレンダー追加
// ============================================================

calendars.post("/ical", async (c) => {
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

	// リクエストボディをパース
	let body: { url: string; name?: string };
	try {
		body = await c.req.json();
	} catch {
		return c.json(
			{
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのパースに失敗しました",
				},
			},
			400,
		);
	}

	// URLの存在チェック
	if (!body.url || typeof body.url !== "string") {
		return c.json(
			{
				error: {
					code: "INVALID_URL",
					message: "URLを指定してください",
				},
			},
			400,
		);
	}

	// iCalカレンダーを追加
	const result = await addICalCalendar(ctx, body.url, body.name);

	if (isOk(result)) {
		return c.json({ calendar: result.value }, 201);
	}

	// エラーコードに応じてステータスコードを決定
	const errorCode = result.error.code;
	const isClientError =
		errorCode === "INVALID_URL" ||
		errorCode === "PARSE_ERROR" ||
		errorCode === "NETWORK_ERROR";

	return c.json(
		{ error: { code: errorCode, message: result.error.message } },
		isClientError ? 400 : 500,
	);
});

// ============================================================
// POST /calendars/sync - 全カレンダー同期
// ============================================================

calendars.post("/sync", async (c) => {
	const oauthConfig = getOAuthConfig(c.env);
	const ctx = await buildCalendarContext(
		c.get("db"),
		c.get("userId"),
		c.get("encryptionKey"),
		oauthConfig,
	);
	if (!ctx) {
		return c.json(
			{
				error: { code: "CONFIG_ERROR", message: "暗号化キーインポートエラー" },
			},
			500,
		);
	}

	const result = await syncAllCalendars(ctx);

	if (!isOk(result)) {
		console.error("[sync-api] 同期致命的エラー:", result.error.message);
		return c.json({ success: false, error: result.error.message }, 500);
	}

	const { successCount, errorCalendars, syncedAt } = result.value;

	for (const ec of errorCalendars) {
		console.error(
			`[sync-api] エラーカレンダー: ${ec.calendarId} (${ec.name}): ${ec.error.message}`,
		);
	}

	return c.json({
		success: true,
		syncedAt: syncedAt.toISOString(),
		successCount,
		errorCalendars: errorCalendars.map((ec) => ({
			id: ec.calendarId,
			name: ec.name,
			error: ec.error.message,
		})),
	});
});

export { calendars };
