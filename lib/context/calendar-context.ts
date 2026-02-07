/**
 * カレンダー依存性注入コンテキスト
 *
 * リポジトリのインスタンス管理を一元化し、
 * ユースケース層への依存性注入を実現します。
 *
 * @module lib/context/calendar-context
 */

import { D1ConfigRepository } from "@/lib/infrastructure/config/d1-config-repository";
import { D1EventRepository } from "@/lib/infrastructure/db/d1-event-repository";
import { D1SecretRepository } from "@/lib/infrastructure/secret/d1-secret-repository";

// ============================================================
// 型定義
// ============================================================

/**
 * カレンダーコンテキスト
 *
 * 各リポジトリとユーザー情報を保持する依存性注入コンテナ。
 * ユースケース層はこのコンテキストを通じてインフラ層にアクセスします。
 */
export interface CalendarContext {
	readonly eventRepository: D1EventRepository;
	readonly configRepository: D1ConfigRepository;
	readonly secretRepository: D1SecretRepository;
	readonly userId: string;
}

// ============================================================
// ファクトリ関数
// ============================================================

/**
 * CalendarContextを生成
 *
 * D1データベースとユーザー情報から各リポジトリをインスタンス化し、
 * コンテキストとして返します。
 *
 * @param db - Cloudflare D1データベース接続
 * @param userId - 現在のユーザーID（マルチテナント分離用）
 * @param encryptionKey - シークレット暗号化用のCryptoKey
 * @returns CalendarContext
 */
export const createCalendarContext = (
	db: D1Database,
	userId: string,
	encryptionKey: CryptoKey,
): CalendarContext => ({
	eventRepository: new D1EventRepository(db, userId),
	configRepository: new D1ConfigRepository(db, userId),
	secretRepository: new D1SecretRepository(db, userId, encryptionKey),
	userId,
});
