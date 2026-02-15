/**
 * モバイルアプリ用JWT発行エンドポイント
 *
 * Google ID Tokenを検証し、ユーザーを作成または取得した上で
 * Web Crypto API (HS256) でJWTを署名して返却します。
 *
 * @endpoint POST /api/auth/mobile/token
 *
 * @example
 * ```typescript
 * // リクエスト
 * const response = await fetch('/api/auth/mobile/token', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ idToken: 'google-id-token-here' }),
 * });
 *
 * // 成功レスポンス (200)
 * // { "token": "jwt-token", "user": { "id": "...", "name": "...", "email": "...", "image": "..." } }
 *
 * // エラーレスポンス (400)
 * // { "error": "idTokenは必須です" }
 *
 * // エラーレスポンス (401)
 * // { "error": "無効なGoogle IDトークンです" }
 *
 * // エラーレスポンス (500)
 * // { "error": "トークン生成に失敗しました" }
 * ```
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// ============================================================
// Zodスキーマ定義
// ============================================================

/** リクエストボディのバリデーションスキーマ */
const mobileTokenRequestSchema = z.object({
	idToken: z.string().min(1, "idTokenは必須です"),
});

/** Google tokeninfo APIレスポンスのバリデーションスキーマ */
const googleTokenInfoSchema = z.object({
	email: z.string().email("無効なメールアドレスです"),
	name: z.string().optional(),
	picture: z.string().url().optional(),
});

/** usersテーブルの行データ */
interface UserRow {
	readonly id: string;
	readonly name: string | null;
	readonly email: string;
	readonly image: string | null;
}

// ============================================================
// JWT関連ユーティリティ（Web Crypto API使用）
// ============================================================

/**
 * Base64URLエンコード
 *
 * RFC 7515準拠のBase64URLエンコードを行います。
 * +を-に、/を_に置換し、末尾の=パディングを除去します。
 *
 * @param data - エンコード対象のバイト配列
 * @returns Base64URLエンコードされた文字列
 */
function base64UrlEncode(data: Uint8Array): string {
	return btoa(String.fromCharCode(...data))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/**
 * Web Crypto APIを使用してJWTを生成
 *
 * HS256アルゴリズムでHMAC署名したJWTを生成します。
 * Cloudflare Workers環境のcrypto.subtleを使用します。
 *
 * @param payload - JWTペイロード
 * @param secret - 署名用シークレット文字列
 * @returns 署名済みJWT文字列
 */
async function createJwt(
	payload: Record<string, unknown>,
	secret: string,
): Promise<string> {
	const header = { alg: "HS256", typ: "JWT" };
	const encoder = new TextEncoder();

	const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
	const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
	const data = `${headerB64}.${payloadB64}`;

	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(data),
	);
	const signatureB64 = base64UrlEncode(new Uint8Array(signature));

	return `${data}.${signatureB64}`;
}

// ============================================================
// Google ID Token検証
// ============================================================

/**
 * Google tokeninfo APIでID Tokenを検証
 *
 * @param idToken - Google ID Token
 * @returns 検証結果（メール、名前、画像URL）またはnull
 */
async function verifyGoogleIdToken(
	idToken: string,
): Promise<{ email: string; name: string; picture: string } | null> {
	try {
		const response = await fetch(
			`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
		);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		const parsed = googleTokenInfoSchema.safeParse(data);

		if (!parsed.success) {
			return null;
		}

		return {
			email: parsed.data.email,
			name: parsed.data.name ?? "",
			picture: parsed.data.picture ?? "",
		};
	} catch {
		return null;
	}
}

// ============================================================
// ユーザー検索・作成
// ============================================================

/**
 * メールアドレスでユーザーを検索し、存在しなければ作成
 *
 * @param db - D1データベースインスタンス
 * @param email - メールアドレス
 * @param name - ユーザー名
 * @param image - プロフィール画像URL
 * @returns ユーザー情報
 */
async function findOrCreateUser(
	db: D1Database,
	email: string,
	name: string,
	image: string,
): Promise<UserRow> {
	const existing = await db
		.prepare("SELECT * FROM users WHERE email = ?")
		.bind(email)
		.first<UserRow>();

	if (existing) {
		return existing;
	}

	const id = crypto.randomUUID();
	await db
		.prepare("INSERT INTO users (id, name, email, image) VALUES (?, ?, ?, ?)")
		.bind(id, name, email, image)
		.run();

	return { id, name, email, image };
}

// ============================================================
// POSTハンドラ
// ============================================================

/**
 * モバイルアプリからのトークン発行リクエストを処理
 *
 * 処理フロー:
 * 1. リクエストボディのバリデーション（Zod）
 * 2. Google ID Tokenの検証（tokeninfo API）
 * 3. ユーザーの検索または作成（D1）
 * 4. JWTの生成と返却（Web Crypto API / HS256）
 */
export async function POST(request: Request) {
	try {
		// リクエストボディのパースとバリデーション
		const body = await request.json();
		const validation = mobileTokenRequestSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "idTokenは必須です" },
				{ status: 400 },
			);
		}

		const { idToken } = validation.data;

		// Google ID Tokenの検証
		const googleUser = await verifyGoogleIdToken(idToken);
		if (!googleUser) {
			return NextResponse.json(
				{ error: "無効なGoogle IDトークンです" },
				{ status: 401 },
			);
		}

		// D1データベースとJWTシークレットの取得
		const { env } = await getCloudflareContext();
		const db = env.DB;
		const jwtSecret = env.MOBILE_JWT_SECRET;

		if (!db) {
			console.error("[mobile/token] D1データベースバインディングが見つかりません");
			return NextResponse.json(
				{ error: "トークン生成に失敗しました" },
				{ status: 500 },
			);
		}

		if (!jwtSecret) {
			console.error(
				"[mobile/token] 環境変数 MOBILE_JWT_SECRET が設定されていません",
			);
			return NextResponse.json(
				{ error: "トークン生成に失敗しました" },
				{ status: 500 },
			);
		}

		// ユーザー検索・作成
		const user = await findOrCreateUser(
			db,
			googleUser.email,
			googleUser.name,
			googleUser.picture,
		);

		// JWT生成（有効期限: 24時間）
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			sub: user.id,
			email: user.email,
			name: user.name,
			iat: now,
			exp: now + 24 * 60 * 60,
		};

		const token = await createJwt(payload, jwtSecret);

		return NextResponse.json({
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			},
		});
	} catch (e) {
		console.error("[mobile/token] トークン生成エラー:", e);
		return NextResponse.json(
			{ error: "トークン生成に失敗しました" },
			{ status: 500 },
		);
	}
}
