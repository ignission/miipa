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

/** Google ID Tokenペイロードのバリデーションスキーマ */
const googleIdTokenPayloadSchema = z.object({
	/** 発行者（issuer） */
	iss: z.string(),
	/** Google ID Tokenの対象クライアントID */
	aud: z.string(),
	/** 有効期限（UNIXタイムスタンプ） */
	exp: z.number(),
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
// Google JWKS（公開鍵）取得・キャッシュ
// ============================================================

/** Google公開鍵エンドポイント */
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

/** Google ID Tokenで許可されるissuer */
const GOOGLE_ISSUERS = [
	"https://accounts.google.com",
	"accounts.google.com",
] as const;

/** JWKSキャッシュの有効期間（ミリ秒）: 1時間 */
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

/** JWK (JSON Web Key) の型定義 */
interface GoogleJwk {
	readonly kty: string;
	readonly kid: string;
	readonly alg: string;
	readonly n: string;
	readonly e: string;
	readonly use: string;
}

/** JWKSレスポンスの型定義 */
interface JwksResponse {
	readonly keys: readonly GoogleJwk[];
}

/** JWKSキャッシュ: kid -> CryptoKeyのマップと取得時刻 */
let jwksCache: { keys: Map<string, CryptoKey>; fetchedAt: number } | null =
	null;

/**
 * GoogleのJWKS公開鍵を取得し、CryptoKeyに変換してキャッシュする
 *
 * キャッシュが有効（1時間以内）であればネットワークリクエストを省略します。
 * キャッシュミスまたは有効期限切れの場合のみGoogle JWKSエンドポイントにアクセスします。
 *
 * @returns kid -> CryptoKey のマップ
 */
async function getGooglePublicKeys(): Promise<Map<string, CryptoKey>> {
	const now = Date.now();

	// キャッシュが有効ならそのまま返す
	if (jwksCache && now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS) {
		return jwksCache.keys;
	}

	const response = await fetch(GOOGLE_JWKS_URL);
	if (!response.ok) {
		throw new Error(
			`Google JWKS取得に失敗しました: HTTP ${response.status}`,
		);
	}

	const jwks: JwksResponse = await response.json();
	const keys = new Map<string, CryptoKey>();

	for (const jwk of jwks.keys) {
		// RS256鍵のみをインポート
		if (jwk.kty !== "RSA" || jwk.alg !== "RS256") {
			continue;
		}

		const cryptoKey = await crypto.subtle.importKey(
			"jwk",
			{ kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
			{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
			false,
			["verify"],
		);
		keys.set(jwk.kid, cryptoKey);
	}

	jwksCache = { keys, fetchedAt: now };
	return keys;
}

// ============================================================
// Google ID Token検証
// ============================================================

/**
 * Base64URL文字列をUint8Arrayにデコードする
 *
 * JWTの各パート（ヘッダ・ペイロード・署名）のデコードに使用します。
 *
 * @param str - Base64URLエンコードされた文字列
 * @returns デコード済みバイト配列
 */
function base64UrlDecode(str: string): Uint8Array {
	// Base64URL -> 標準Base64に変換（-を+に、_を/に戻し、パディング補完）
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64.padEnd(
		base64.length + ((4 - (base64.length % 4)) % 4),
		"=",
	);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Google公開鍵（JWKS）を使用してID Tokenの署名を暗号学的に検証
 *
 * tokeninfo API（デバッグ用途）ではなく、Googleの公開鍵で
 * RS256署名を直接検証します。以下の検証を行います:
 *
 * 1. JWTの構造検証（header.payload.signatureの3パート）
 * 2. ヘッダのkidに対応するGoogle公開鍵でRS256署名を検証
 * 3. issuer が https://accounts.google.com であることを検証
 * 4. audience が expectedClientId と一致することを検証
 * 5. 有効期限（exp）が現在時刻より未来であることを検証
 *
 * OWASP参照: Authentication Cheat Sheet - Token-based Authentication
 *
 * @param idToken - Google ID Token（JWT形式）
 * @param expectedClientId - 期待するGoogle OAuthクライアントID
 * @returns 検証結果（メール、名前、画像URL）またはnull
 */
async function verifyGoogleIdToken(
	idToken: string,
	expectedClientId: string,
): Promise<{ email: string; name: string; picture: string } | null> {
	try {
		// JWTを3パートに分割: ヘッダ.ペイロード.署名
		const parts = idToken.split(".");
		if (parts.length !== 3) {
			return null;
		}

		const [headerB64, payloadB64, signatureB64] = parts;

		// ヘッダからkid（キーID）を取得
		const header = JSON.parse(
			new TextDecoder().decode(base64UrlDecode(headerB64)),
		);
		const kid: unknown = header.kid;
		if (typeof kid !== "string" || !kid) {
			return null;
		}

		// アルゴリズムがRS256であることを検証（アルゴリズム混乱攻撃の防止）
		if (header.alg !== "RS256") {
			return null;
		}

		// Google公開鍵を取得し、kidに対応する鍵を特定
		const publicKeys = await getGooglePublicKeys();
		const publicKey = publicKeys.get(kid);

		// kidに対応する鍵が見つからない場合、キャッシュが古い可能性がある
		// キャッシュをクリアして再取得を試みる（鍵ローテーション対応）
		if (!publicKey) {
			jwksCache = null;
			const refreshedKeys = await getGooglePublicKeys();
			const refreshedKey = refreshedKeys.get(kid);
			if (!refreshedKey) {
				console.error(
					`[mobile/token] Google公開鍵が見つかりません: kid=${kid}`,
				);
				return null;
			}
			return verifyWithKey(
				refreshedKey,
				headerB64,
				payloadB64,
				signatureB64,
				expectedClientId,
			);
		}

		return verifyWithKey(
			publicKey,
			headerB64,
			payloadB64,
			signatureB64,
			expectedClientId,
		);
	} catch {
		return null;
	}
}

/**
 * 指定された公開鍵でJWTの署名を検証し、ペイロードのクレームを検証する
 *
 * @param publicKey - Google RSA公開鍵（CryptoKey）
 * @param headerB64 - Base64URLエンコードされたJWTヘッダ
 * @param payloadB64 - Base64URLエンコードされたJWTペイロード
 * @param signatureB64 - Base64URLエンコードされたJWT署名
 * @param expectedClientId - 期待するGoogle OAuthクライアントID
 * @returns 検証結果またはnull
 */
async function verifyWithKey(
	publicKey: CryptoKey,
	headerB64: string,
	payloadB64: string,
	signatureB64: string,
	expectedClientId: string,
): Promise<{ email: string; name: string; picture: string } | null> {
	// RS256署名を暗号学的に検証
	const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
	const signature = base64UrlDecode(signatureB64);

	const isValid = await crypto.subtle.verify(
		{ name: "RSASSA-PKCS1-v1_5" },
		publicKey,
		signature,
		signedData,
	);

	if (!isValid) {
		console.error("[mobile/token] ID Tokenの署名検証に失敗しました");
		return null;
	}

	// ペイロードをデコードしてバリデーション
	const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
	const parsed = googleIdTokenPayloadSchema.safeParse(JSON.parse(payloadJson));

	if (!parsed.success) {
		return null;
	}

	const payload = parsed.data;

	// issuer検証: Google発行のトークンであることを確認
	if (!GOOGLE_ISSUERS.includes(payload.iss as (typeof GOOGLE_ISSUERS)[number])) {
		console.error(
			`[mobile/token] iss不正: ${payload.iss}`,
		);
		return null;
	}

	// audience検証: 別アプリ用トークンでの認証突破を防止
	if (payload.aud !== expectedClientId) {
		console.error(
			`[mobile/token] aud不一致: 期待値=${expectedClientId}, 実際=${payload.aud}`,
		);
		return null;
	}

	// 有効期限検証: 期限切れトークンの使用を防止
	const nowInSeconds = Math.floor(Date.now() / 1000);
	if (payload.exp < nowInSeconds) {
		console.error("[mobile/token] ID Tokenの有効期限切れです");
		return null;
	}

	return {
		email: payload.email,
		name: payload.name ?? "",
		picture: payload.picture ?? "",
	};
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
 * 2. Google ID Tokenの検証（JWKS公開鍵によるRS256署名検証 + iss/aud/exp検証）
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
