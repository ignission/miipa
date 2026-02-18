/**
 * Google認証時のカレンダー自動セットアップ（Hono版）
 *
 * Honoミドルウェアから db, encryptionKey を受け取り、
 * トークン保存とカレンダー一覧のD1保存を実行します。
 */

import type { CalendarConfig } from "@/lib/config";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared";
import { createCalendarId } from "@/lib/domain/shared/types";
import { GoogleCalendarProvider } from "@/lib/infrastructure/calendar/google-provider";
import { saveTokens } from "@/lib/infrastructure/calendar/token-store";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * カレンダー設定IDを生成
 */
function generateCalendarConfigId(
	accountEmail: string,
	googleCalendarId: string,
): string {
	const sanitizedEmail = accountEmail.replace(/[^a-zA-Z0-9]/g, "-");
	const sanitizedCalendarId = googleCalendarId.replace(/[^a-zA-Z0-9]/g, "-");
	return `google-${sanitizedEmail}-${sanitizedCalendarId}`;
}

/**
 * Google認証完了時にカレンダーを自動セットアップ
 *
 * @param db - D1データベース（Honoのc.envから取得）
 * @param encryptionKeyStr - 暗号化キー文字列（Honoのc.envから取得）
 * @param userId - ユーザーID
 * @param accountEmail - Googleアカウントのメールアドレス
 * @param accessToken - OAuthアクセストークン
 * @param refreshToken - OAuthリフレッシュトークン
 * @param expiresAt - トークン有効期限（Unix秒）
 */
export async function autoSetupCalendars(
	db: D1Database,
	encryptionKeyStr: string,
	userId: string,
	accountEmail: string,
	accessToken: string,
	refreshToken: string,
	expiresAt: number | undefined,
): Promise<void> {
	const cryptoKeyResult = await importEncryptionKey(encryptionKeyStr);
	if (!isOk(cryptoKeyResult)) {
		console.error(
			"[autoSetup] 暗号化キーインポート失敗:",
			cryptoKeyResult.error,
		);
		return;
	}

	const ctx = createCalendarContext(db, userId, cryptoKeyResult.value);

	// トークン保存
	const tokens = {
		accessToken,
		refreshToken,
		expiresAt: expiresAt
			? new Date(expiresAt * 1000)
			: new Date(Date.now() + 3600 * 1000),
	};
	const saveResult = await saveTokens(
		ctx.secretRepository,
		accountEmail,
		tokens,
	);
	if (!isOk(saveResult)) {
		console.error("[autoSetup] トークン保存失敗:", saveResult.error);
		return;
	}

	// カレンダー一覧取得 + D1保存
	const provider = new GoogleCalendarProvider(
		accountEmail,
		tokens,
		ctx.secretRepository,
	);
	const calendarsResult = await provider.getCalendars();
	if (!isOk(calendarsResult)) {
		console.error("[autoSetup] カレンダー一覧取得失敗:", calendarsResult.error);
		return;
	}

	// 既存カレンダー設定を取得
	const existingResult = await ctx.configRepository.getSetting("calendars");
	const existingCalendars: CalendarConfig[] =
		isOk(existingResult) && existingResult.value
			? (JSON.parse(existingResult.value) as CalendarConfig[])
			: [];
	const existingIds = new Set(existingCalendars.map((c) => c.id as string));

	// 新しいカレンダー設定を作成
	const newCalendars: CalendarConfig[] = [];
	for (const cal of calendarsResult.value) {
		const configId = generateCalendarConfigId(accountEmail, cal.id);
		if (existingIds.has(configId)) continue;

		newCalendars.push({
			id: createCalendarId(configId),
			type: "google",
			name: cal.name,
			enabled: cal.primary,
			color: cal.color,
			googleAccountEmail: accountEmail,
			googleCalendarId: cal.id,
		});
	}

	if (newCalendars.length > 0) {
		const updated = [...existingCalendars, ...newCalendars];
		const setResult = await ctx.configRepository.setSetting(
			"calendars",
			JSON.stringify(updated),
		);
		if (!isOk(setResult)) {
			console.error("[autoSetup] カレンダー設定保存失敗:", setResult.error);
		}
	}
}
