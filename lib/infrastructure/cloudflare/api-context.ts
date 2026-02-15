import { auth } from "@/auth";
import {
	type CalendarContext,
	createCalendarContext,
} from "@/lib/context/calendar-context";
import { err, isOk, ok, type Result } from "@/lib/domain/shared/result";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

// ============================================================
// 型定義
// ============================================================

export interface AuthenticatedContext {
	readonly session: { readonly user: { readonly id: string } };
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
 * Auth.jsセッション認証、D1データベース取得、暗号化キーインポート、
 * CalendarContext生成を一括で行う。
 */
export async function createAuthenticatedContext(): Promise<
	Result<AuthenticatedContext, ApiContextError>
> {
	// 1. Auth.jsセッション認証
	const session = await auth();
	if (!session?.user?.id) {
		return err({
			code: "UNAUTHORIZED",
			message: "認証が必要です",
			status: 401,
		});
	}

	// 2. D1データベース取得
	const dbResult = getD1Database();
	if (!isOk(dbResult)) {
		return err({
			code: "DB_ERROR",
			message: "データベース接続エラー",
			status: 500,
		});
	}

	// 3. 暗号化キー取得
	const keyResult = getEncryptionKey();
	if (!isOk(keyResult)) {
		return err({
			code: "CONFIG_ERROR",
			message: "暗号化キー取得エラー",
			status: 500,
		});
	}

	// 4. CryptoKeyにインポート
	const cryptoKeyResult = await importEncryptionKey(keyResult.value);
	if (!isOk(cryptoKeyResult)) {
		return err({
			code: "CONFIG_ERROR",
			message: "暗号化キーインポートエラー",
			status: 500,
		});
	}

	// 5. コンテキスト作成
	const calendarCtx = createCalendarContext(
		dbResult.value,
		session.user.id,
		cryptoKeyResult.value,
	);

	return ok({
		session: { user: { id: session.user.id } },
		calendarCtx,
	});
}
