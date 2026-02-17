/**
 * チャット設定 API エンドポイント
 *
 * チャット送信キー設定の取得・更新を行います。
 * Auth.js認証チェック後、D1コンテキストを使用して設定を操作します。
 *
 * @endpoint GET /api/settings/chat
 * @endpoint PUT /api/settings/chat
 */

import { type NextRequest, NextResponse } from "next/server";
import { isErr, isOk } from "@/lib/domain/shared/result";
import { createAuthenticatedContext } from "@/lib/infrastructure/cloudflare/api-context";

/** 送信キーの設定値 */
type SendKey = "enter" | "cmd+enter";

/** デフォルトの送信キー */
const DEFAULT_SEND_KEY: SendKey = "enter";

/** 許可される送信キーの値 */
const VALID_SEND_KEYS: readonly SendKey[] = ["enter", "cmd+enter"];

/**
 * チャット設定更新リクエストボディ
 */
interface UpdateChatSettingsRequest {
	/** 送信キー設定 */
	readonly sendKey?: string;
}

/**
 * 値が有効な送信キーかどうかを判定する
 *
 * @param value - 判定対象の値
 * @returns 有効な送信キーの場合はtrue
 */
function isSendKey(value: string | null | undefined): value is SendKey {
	return VALID_SEND_KEYS.includes(value as SendKey);
}

/**
 * 現在のチャット送信キー設定を取得する
 *
 * - D1からchat_send_key設定を取得
 * - 未設定の場合はデフォルト値（enter）を返す
 *
 * @returns 送信キー設定のレスポンス
 */
export async function GET() {
	const ctxResult = await createAuthenticatedContext();
	if (isErr(ctxResult)) {
		return NextResponse.json(
			{
				error: {
					code: ctxResult.error.code,
					message: ctxResult.error.message,
				},
			},
			{ status: ctxResult.error.status },
		);
	}
	const { calendarCtx } = ctxResult.value;

	const result =
		await calendarCtx.configRepository.getSetting("chat_send_key");
	if (isErr(result)) {
		return NextResponse.json(
			{
				error: {
					code: "CONFIG_ERROR",
					message: "チャット送信キー設定の取得に失敗しました",
				},
			},
			{ status: 500 },
		);
	}

	const sendKey: SendKey = isSendKey(result.value)
		? result.value
		: DEFAULT_SEND_KEY;

	return NextResponse.json({ sendKey });
}

/**
 * チャット送信キー設定を更新する
 *
 * - sendKeyのバリデーション（"enter" または "cmd+enter" のみ許可）
 * - D1にchat_send_key設定を保存
 *
 * @param request - リクエストオブジェクト
 * @returns 更新結果
 */
export async function PUT(request: NextRequest) {
	const ctxResult = await createAuthenticatedContext();
	if (isErr(ctxResult)) {
		return NextResponse.json(
			{
				error: {
					code: ctxResult.error.code,
					message: ctxResult.error.message,
				},
			},
			{ status: ctxResult.error.status },
		);
	}
	const { calendarCtx } = ctxResult.value;

	let body: UpdateChatSettingsRequest;
	try {
		body = (await request.json()) as UpdateChatSettingsRequest;
	} catch {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message: "リクエストボディのJSONパースに失敗しました",
				},
			},
			{ status: 400 },
		);
	}

	if (!body.sendKey || !isSendKey(body.sendKey)) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "INVALID_REQUEST",
					message:
						"sendKeyには \"enter\" または \"cmd+enter\" を指定してください",
				},
			},
			{ status: 400 },
		);
	}

	const result = await calendarCtx.configRepository.setSetting(
		"chat_send_key",
		body.sendKey,
	);

	if (isOk(result)) {
		return NextResponse.json({ success: true });
	}

	return NextResponse.json(
		{
			success: false,
			error: { code: result.error.code, message: result.error.message },
		},
		{ status: 500 },
	);
}
