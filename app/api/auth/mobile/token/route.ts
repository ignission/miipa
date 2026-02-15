/**
 * モバイルアプリ用JWT発行エンドポイント
 *
 * Google ID Tokenを検証し、ユーザーを作成または取得した上で
 * Web Crypto API (HS256) でJWTを署名して返却します。
 * リフレッシュトークンによるJWT再発行にも対応します。
 *
 * @endpoint POST /api/auth/mobile/token
 *
 * @example
 * ```typescript
 * // Google ID Tokenでの初回認証リクエスト
 * const response = await fetch('/api/auth/mobile/token', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ idToken: 'google-id-token-here' }),
 * });
 *
 * // リフレッシュトークンでのJWT再発行リクエスト
 * const response = await fetch('/api/auth/mobile/token', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ grantType: 'refresh_token', refreshToken: '...' }),
 * });
 *
 * // 成功レスポンス (200)
 * // { "token": "jwt-token", "refreshToken": "...", "expiresIn": 86400, "user": { ... } }
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
// 定数
// ============================================================

/** アクセストークンの有効期限（秒）: 24時間 */
const ACCESS_TOKEN_EXPIRES_IN = 24 * 60 * 60;

/** リフレッシュトークンの有効期限（秒）: 30日 */
const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60;

// ============================================================
// Zodスキーマ定義
// ============================================================

/** Google ID Tokenでの認証リクエスト */
const idTokenRequestSchema = z.object({
	idToken: z.string().min(1, "idTokenは必須です"),
	grantType: z.undefined().optional(),
});

/** リフレッシュトークンでの再発行リクエスト */
const refreshTokenRequestSchema = z.object({
	grantType: z.literal("refresh_token"),
	refreshToken: z.string().min(1, "refreshTokenは必須です"),
});

/** リクエストボディのバリデーションスキーマ（ユニオン型） */
const mobileTokenRequestSchema = z.union([
	idTokenRequestSchema,
	refreshTokenRequestSchema,
]);

/** Google tokeninfo APIレスポンスのバリデーションスキーマ */
const googleTokenInfoSchema = z.object({
	/** Google ID Tokenの対象クライアントID */
	aud: z.string(),
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

/** refresh_tokensテーブルの行データ */
interface RefreshTokenRow {
	readonly id: string;
	readonly user_id: string;
	readonly token_hash: string;
	readonly expires_at: string;
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
 * audフィールドがexpectedClientIdと一致することを検証し、
 * 別アプリ用トークンによる認証突破を防止します。
 *
 * @param idToken - Google ID Token
 * @param expectedClientId - 期待するGoogle OAuthクライアントID
 * @returns 検証結果（メール、名前、画像URL）またはnull
 */
async function verifyGoogleIdToken(
	idToken: string,
	expectedClientId: string,
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

		// aud（audience）がこのアプリのクライアントIDと一致するか検証
		// 別アプリ用のGoogle ID Tokenでの認証突破を防止する
		if (parsed.data.aud !== expectedClientId) {
			console.error(
				`[mobile/token] aud不一致: 期待値=${expectedClientId}, 実際=${parsed.data.aud}`,
			);
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
	const id = crypto.randomUUID();

	// INSERT OR IGNOREで競合時は無視し、その後SELECTで取得する
	// SELECT→INSERTの間に別リクエストが割り込む競合条件を回避
	await db
		.prepare(
			"INSERT OR IGNORE INTO users (id, name, email, image) VALUES (?, ?, ?, ?)",
		)
		.bind(id, name, email, image)
		.run();

	const user = await db
		.prepare("SELECT * FROM users WHERE email = ?")
		.bind(email)
		.first<UserRow>();

	// INSERT OR IGNOREの直後なので必ず存在するが、型安全のためチェック
	if (!user) {
		throw new Error(`ユーザーの作成に失敗しました: ${email}`);
	}

	return user;
}

// ============================================================
// リフレッシュトークン管理
// ============================================================

/**
 * トークンをSHA-256でハッシュ化し、base64url文字列として返す
 *
 * DBにはハッシュのみを保存することで、DBリーク時のセッションハイジャックを防止します。
 *
 * @param token - ハッシュ対象のトークン文字列
 * @returns SHA-256ハッシュのbase64url文字列
 */
async function hashToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(token),
	);
	return base64UrlEncode(new Uint8Array(digest));
}

/**
 * セキュアなリフレッシュトークンを生成
 *
 * crypto.randomUUID を2つ連結して十分なエントロピーを確保します。
 *
 * @returns ランダムなリフレッシュトークン文字列
 */
function generateRefreshToken(): string {
	return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

/**
 * リフレッシュトークンをSHA-256ハッシュ化してD1に保存
 *
 * クライアントには平文トークンを返しますが、DBにはハッシュのみを保存します。
 *
 * @param db - D1データベースインスタンス
 * @param userId - ユーザーID
 * @param token - リフレッシュトークン（平文）
 * @param expiresInSeconds - 有効期限（秒）
 */
async function saveRefreshToken(
	db: D1Database,
	userId: string,
	token: string,
	expiresInSeconds: number,
): Promise<void> {
	const id = crypto.randomUUID();
	const expiresAt = new Date(
		Date.now() + expiresInSeconds * 1000,
	).toISOString();
	const tokenHash = await hashToken(token);

	await db
		.prepare(
			"INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
		)
		.bind(id, userId, tokenHash, expiresAt)
		.run();
}

/**
 * リフレッシュトークンを検証し、対応するユーザーを取得
 *
 * 受け取った平文トークンをSHA-256ハッシュ化してからDB検索します。
 * 使用済みのリフレッシュトークンは削除し、トークンローテーションを実現します。
 *
 * @param db - D1データベースインスタンス
 * @param token - リフレッシュトークン（平文）
 * @returns ユーザー情報またはnull
 */
async function consumeRefreshToken(
	db: D1Database,
	token: string,
): Promise<UserRow | null> {
	const tokenHash = await hashToken(token);
	const row = await db
		.prepare(
			"SELECT rt.id, rt.user_id, rt.expires_at FROM refresh_tokens rt WHERE rt.token_hash = ?",
		)
		.bind(tokenHash)
		.first<RefreshTokenRow>();

	if (!row) {
		return null;
	}

	// 使用済みトークンを削除（ローテーション）
	await db
		.prepare("DELETE FROM refresh_tokens WHERE id = ?")
		.bind(row.id)
		.run();

	// 有効期限チェック
	if (new Date(row.expires_at) < new Date()) {
		return null;
	}

	// 対応するユーザーを取得
	const user = await db
		.prepare("SELECT * FROM users WHERE id = ?")
		.bind(row.user_id)
		.first<UserRow>();

	return user ?? null;
}

/**
 * JWT生成とリフレッシュトークン発行を行い、レスポンスを返す共通関数
 */
async function issueTokens(
	db: D1Database,
	user: UserRow,
	jwtSecret: string,
): Promise<Response> {
	const now = Math.floor(Date.now() / 1000);
	const payload = {
		sub: user.id,
		email: user.email,
		name: user.name,
		iat: now,
		exp: now + ACCESS_TOKEN_EXPIRES_IN,
	};

	const token = await createJwt(payload, jwtSecret);

	// リフレッシュトークンの生成と保存
	const refreshToken = generateRefreshToken();
	await saveRefreshToken(db, user.id, refreshToken, REFRESH_TOKEN_EXPIRES_IN);

	return NextResponse.json({
		token,
		refreshToken,
		expiresIn: ACCESS_TOKEN_EXPIRES_IN,
		user: {
			id: user.id,
			name: user.name,
			email: user.email,
			image: user.image,
		},
	});
}

// ============================================================
// POSTハンドラ
// ============================================================

/**
 * モバイルアプリからのトークン発行リクエストを処理
 *
 * 処理フロー（Google ID Token認証）:
 * 1. リクエストボディのバリデーション（Zod）
 * 2. Google ID Tokenの検証（tokeninfo API + aud検証）
 * 3. ユーザーの検索または作成（D1）
 * 4. JWT + リフレッシュトークンの生成と返却
 *
 * 処理フロー（リフレッシュトークン）:
 * 1. リクエストボディのバリデーション（Zod）
 * 2. リフレッシュトークンの検証と消費（D1）
 * 3. 新しいJWT + リフレッシュトークンの生成と返却（ローテーション）
 */
export async function POST(request: Request) {
	try {
		// リクエストボディのパースとバリデーション
		const body = await request.json();
		const validation = mobileTokenRequestSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{ error: "リクエストが不正です" },
				{ status: 400 },
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

		const data = validation.data;

		// リフレッシュトークンによるJWT再発行
		if ("grantType" in data && data.grantType === "refresh_token") {
			const user = await consumeRefreshToken(db, data.refreshToken);
			if (!user) {
				return NextResponse.json(
					{ error: "無効なリフレッシュトークンです" },
					{ status: 401 },
				);
			}

			return issueTokens(db, user, jwtSecret);
		}

		// Google ID Tokenによる認証
		const googleClientId = env.GOOGLE_CLIENT_ID;
		if (!googleClientId) {
			console.error(
				"[mobile/token] 環境変数 GOOGLE_CLIENT_ID が設定されていません",
			);
			return NextResponse.json(
				{ error: "トークン生成に失敗しました" },
				{ status: 500 },
			);
		}

		const googleUser = await verifyGoogleIdToken(
			data.idToken,
			googleClientId,
		);
		if (!googleUser) {
			return NextResponse.json(
				{ error: "無効なGoogle IDトークンです" },
				{ status: 401 },
			);
		}

		// ユーザー検索・作成
		const user = await findOrCreateUser(
			db,
			googleUser.email,
			googleUser.name,
			googleUser.picture,
		);

		return issueTokens(db, user, jwtSecret);
	} catch (e) {
		console.error("[mobile/token] トークン生成エラー:", e);
		return NextResponse.json(
			{ error: "トークン生成に失敗しました" },
			{ status: 500 },
		);
	}
}
