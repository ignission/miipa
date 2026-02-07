/**
 * 設定保存 API エンドポイント
 *
 * セットアップ設定を保存します。
 * Auth.js認証チェック後、D1コンテキストを使用して設定を保存します。
 *
 * @endpoint POST /api/setup/save-settings
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
	type SaveOptions,
	type SetupSettings,
	saveSetupSettings,
} from "@/lib/application/setup";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared/result";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";

/**
 * 設定保存リクエストボディ
 */
interface SaveSettingsRequest extends SetupSettings {
	/** 既存のAPIキーを上書きするかどうか */
	overwriteExisting?: boolean;
}

/**
 * セットアップ設定を保存する
 *
 * @param request - リクエストオブジェクト
 * @returns 保存結果（success: true/false, requiresConfirmation?: boolean, error?: エラー情報）
 */
export async function POST(request: NextRequest) {
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
				success: false,
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
				success: false,
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
				success: false,
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

	const body = (await request.json()) as SaveSettingsRequest;

	// 必須パラメータのバリデーション
	if (!body.provider) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "プロバイダが指定されていません",
				},
			},
			{ status: 400 },
		);
	}

	// SetupSettings型に変換（overwriteExistingは除外）
	const settings: SetupSettings = {
		provider: body.provider,
		apiKey: body.apiKey,
		baseUrl: body.baseUrl,
		model: body.model,
	};

	// 保存オプション
	const options: SaveOptions = {
		overwriteExisting: body.overwriteExisting ?? false,
	};

	const result = await saveSetupSettings(ctx, settings, options);

	if (isOk(result)) {
		return NextResponse.json({ success: true });
	}

	// KEY_EXISTSの場合は確認を要求（200で返す）
	if (result.error.code === "KEY_EXISTS") {
		return NextResponse.json({
			success: false,
			requiresConfirmation: true,
			error: { code: result.error.code, message: result.error.message },
		});
	}

	// その他のエラーは500を返す
	return NextResponse.json(
		{
			success: false,
			error: { code: result.error.code, message: result.error.message },
		},
		{ status: 500 },
	);
}
