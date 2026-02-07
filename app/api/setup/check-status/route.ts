/**
 * セットアップ状態確認 API エンドポイント
 *
 * アプリケーションのセットアップ状態を取得します。
 * Auth.js認証チェック後、D1コンテキストからステータスを確認します。
 *
 * @endpoint GET /api/setup/check-status
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * セットアップ状態を取得する
 *
 * @returns セットアップ状態（isComplete, currentProvider, hasApiKey）
 */
export async function GET() {
	// 認証チェック
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json(
			{
				error: {
					code: "UNAUTHORIZED",
					message: "認証が必要です",
				},
			},
			{ status: 401 },
		);
	}

	// D1コンテキスト作成
	const dbResult = getD1Database();
	if (!isOk(dbResult)) {
		return NextResponse.json(
			{
				error: {
					code: "DB_ERROR",
					message: "データベース接続エラー",
				},
			},
			{ status: 500 },
		);
	}
	const keyResult = getEncryptionKey();
	if (!isOk(keyResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "暗号化キー取得エラー",
				},
			},
			{ status: 500 },
		);
	}
	const cryptoKeyResult = await importEncryptionKey(keyResult.value);
	if (!isOk(cryptoKeyResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "暗号化キーインポートエラー",
				},
			},
			{ status: 500 },
		);
	}
	const ctx = createCalendarContext(
		dbResult.value,
		session.user.id,
		cryptoKeyResult.value,
	);

	// プロバイダ設定を確認
	const providerResult = await ctx.configRepository.getSetting("llm_provider");
	if (!isOk(providerResult)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "設定の取得に失敗しました",
				},
			},
			{ status: 500 },
		);
	}
	const currentProvider = providerResult.value ?? undefined;

	// APIキーの存在確認
	let hasApiKey = false;
	if (currentProvider) {
		const secretKey = `llm-api-key:${currentProvider}`;
		const hasKeyResult = await ctx.secretRepository.hasSecret(secretKey);
		if (isOk(hasKeyResult)) {
			hasApiKey = hasKeyResult.value;
		}
	}

	// カレンダー数の確認
	const calendarsResult = await ctx.configRepository.getSetting("calendars");
	const calendarCount =
		isOk(calendarsResult) && calendarsResult.value
			? (JSON.parse(calendarsResult.value) as unknown[]).length
			: 0;

	const isComplete = !!currentProvider && hasApiKey;

	return NextResponse.json({
		isComplete,
		currentProvider,
		hasApiKey,
		calendarCount,
	});
}
