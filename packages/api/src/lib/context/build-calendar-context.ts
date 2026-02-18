/**
 * CalendarContext 構築ヘルパー
 *
 * Base64形式の暗号化キーを CryptoKey に変換し、
 * CalendarContext を生成する共通処理を提供します。
 *
 * @module packages/api/src/lib/context/build-calendar-context
 */

import { isOk } from "@/lib/domain/shared/result";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";
import {
	type CalendarContext,
	createCalendarContext,
} from "./calendar-context";

/**
 * Base64暗号化キーから CalendarContext を構築
 *
 * ミドルウェアが設定した encryptionKey (Base64文字列) を CryptoKey に変換し、
 * CalendarContext を生成します。変換に失敗した場合は null を返します。
 *
 * @param db - D1データベース接続
 * @param userId - ユーザーID
 * @param encryptionKeyBase64 - Base64エンコードされた暗号化キー
 * @returns CalendarContext または null
 */
export async function buildCalendarContext(
	db: D1Database,
	userId: string,
	encryptionKeyBase64: string,
): Promise<CalendarContext | null> {
	const cryptoKeyResult = await importEncryptionKey(encryptionKeyBase64);
	if (!isOk(cryptoKeyResult)) {
		return null;
	}
	return createCalendarContext(db, userId, cryptoKeyResult.value);
}
