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
import type { AppType } from "@/context/app-context";
import {
	addICalCalendar,
	startGoogleAuth,
	syncAllCalendars,
} from "@/lib/application/calendar";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import { createCalendarId } from "@/lib/domain/shared/types";
import type { OAuthConfig } from "@/lib/infrastructure/calendar/oauth-service";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/** OAuthConfig を Hono 環境変数から構築 */
function getOAuthConfig(env: AppType["Bindings"]): OAuthConfig {
	const baseUrl =
		env.ENVIRONMENT === "production"
			? "https://miipa.app"
			: "http://localhost:8787";
	return {
		clientId: env.GOOGLE_CLIENT_ID,
		clientSecret: env.GOOGLE_CLIENT_SECRET,
		redirectUri: `${baseUrl}/auth/google/callback`,
	};
}

/** code_verifier を保存する Cookie 名（コールバックと共通） */
const CODE_VERIFIER_COOKIE = "google_oauth_code_verifier";

/** Cookie の有効期限（10分） */
const COOKIE_MAX_AGE = 60 * 10;

const calendars = new Hono<AppType>();

// ============================================================
// ヘルパー: CryptoKey に変換してから CalendarContext を構築
// ============================================================

/**
 * ミドルウェアが設定した encryptionKey (string) を CryptoKey に変換し、
 * CalendarContext を生成します。失敗時は null を返します。
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

	// カレンダー一覧取得
	const settingResult = await ctx.configRepository.getSetting("calendars");
	if (!isOk(settingResult)) {
		return c.json(
			{ error: { code: "DB_ERROR", message: "設定取得エラー" } },
			500,
		);
	}

	// 設定が見つからない場合は空配列を返す
	if (settingResult.value === null) {
		return c.json({ calendars: [] });
	}

	// JSON文字列をパースして返す
	try {
		const calendarList = JSON.parse(settingResult.value);
		return c.json({ calendars: calendarList });
	} catch {
		return c.json(
			{
				error: {
					code: "CONFIG_PARSE_ERROR",
					message: "カレンダー設定のパースに失敗しました",
				},
			},
			500,
		);
	}
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

	// カレンダー設定を取得
	const settingResult = await ctx.configRepository.getSetting("calendars");
	if (!isOk(settingResult)) {
		return c.json(
			{ error: { code: "DB_ERROR", message: "設定取得エラー" } },
			500,
		);
	}

	// カレンダー一覧をパース
	const calendarList: unknown[] =
		settingResult.value !== null ? JSON.parse(settingResult.value) : [];

	// 対象のカレンダーを検索
	const calendarIndex = calendarList.findIndex((cal: any) => cal.id === id);

	if (calendarIndex === -1) {
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

	// カレンダーを配列から削除
	const updatedCalendars = [
		...calendarList.slice(0, calendarIndex),
		...calendarList.slice(calendarIndex + 1),
	];

	// 更新した設定を保存
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

	// キャッシュされたイベントを削除
	const calendarId = createCalendarId(id);
	const deleteResult = await ctx.eventRepository.deleteByCalendar(calendarId);
	if (!isOk(deleteResult)) {
		// イベント削除に失敗しても、カレンダー自体は削除済みなので警告ログのみ
		console.warn(
			`カレンダー ${id} のキャッシュイベント削除に失敗しました: ${deleteResult.error.message}`,
		);
	}

	// 成功: 204 No Content を返す
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

	// リクエストボディをパース
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

	// enabled フィールドのバリデーション
	if (
		typeof body !== "object" ||
		body === null ||
		!("enabled" in body) ||
		typeof (body as { enabled: unknown }).enabled !== "boolean"
	) {
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

	const { enabled } = body as { enabled: boolean };

	// カレンダー設定を取得
	const settingResult = await ctx.configRepository.getSetting("calendars");
	if (!isOk(settingResult)) {
		return c.json(
			{ error: { code: "DB_ERROR", message: "設定取得エラー" } },
			500,
		);
	}

	const calendarList: any[] =
		settingResult.value !== null ? JSON.parse(settingResult.value) : [];

	// 対象のカレンダーを検索
	const calendarIndex = calendarList.findIndex((cal: any) => cal.id === id);

	if (calendarIndex === -1) {
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

	// カレンダーの enabled フィールドを更新
	const updatedCalendar = { ...calendarList[calendarIndex], enabled };

	const updatedCalendars = [
		...calendarList.slice(0, calendarIndex),
		updatedCalendar,
		...calendarList.slice(calendarIndex + 1),
	];

	// 更新した設定を保存
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

	// 成功: 更新されたカレンダーを返す
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

	const result = await syncAllCalendars(ctx);

	if (isOk(result)) {
		console.log(
			`[sync-api] 同期完了: total=${result.value.totalCount}, success=${result.value.successCount}, errors=${result.value.errorCalendars.length}`,
		);
		for (const ec of result.value.errorCalendars) {
			console.error(
				`[sync-api] エラーカレンダー: ${ec.calendarId} (${ec.name}): ${ec.error.message}`,
			);
		}
	} else {
		console.error(`[sync-api] 同期致命的エラー:`, result.error.message);
	}

	if (isOk(result)) {
		const { successCount, errorCalendars, syncedAt } = result.value;

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
	}

	// 設定読み込み失敗などの致命的エラー
	return c.json(
		{
			success: false,
			error: result.error.message,
		},
		500,
	);
});

export { calendars };
