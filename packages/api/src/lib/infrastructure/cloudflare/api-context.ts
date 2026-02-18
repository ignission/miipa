/**
 * 認証済みAPIコンテキスト（Hono版）
 *
 * Auth.js依存を排除し、Honoミドルウェアから
 * userId, db, encryptionKey を受け取る形に変更。
 *
 * @module packages/api/src/lib/infrastructure/cloudflare/api-context
 */

import {
	type CalendarContext,
	createCalendarContext,
} from "@/lib/context/calendar-context";
import { err, isOk, ok, type Result } from "@/lib/domain/shared/result";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

// ============================================================
// 型定義
// ============================================================

export interface AuthenticatedContext {
	readonly userId: string;
	readonly calendarCtx: CalendarContext;
}

export type ApiContextErrorCode = "UNAUTHORIZED" | "DB_ERROR" | "CONFIG_ERROR";

export interface ApiContextError {
	readonly code: ApiContextErrorCode;
	readonly message: string;
	readonly status: number;
}

// ============================================================
// コンテキスト構築
// ============================================================

/**
 * 認証済みAPIコンテキストを構築する共通関数
 *
 * Honoミドルウェアから userId, db, encryptionKey を受け取り、
 * CalendarContext を生成して返します。
 */
export async function createAuthenticatedApiContext(
	db: D1Database,
	userId: string,
	encryptionKeyStr: string,
): Promise<Result<AuthenticatedContext, ApiContextError>> {
	// 暗号化キーをCryptoKeyにインポート
	const cryptoKeyResult = await importEncryptionKey(encryptionKeyStr);
	if (!isOk(cryptoKeyResult)) {
		return err({
			code: "CONFIG_ERROR",
			message: "暗号化キーインポートエラー",
			status: 500,
		});
	}

	// CalendarContext を生成
	const calendarCtx = createCalendarContext(db, userId, cryptoKeyResult.value);

	return ok({
		userId,
		calendarCtx,
	});
}
