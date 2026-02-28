import { describe, expect, it } from "vitest";
import { base64UrlEncode } from "@/lib/utils/base64url";
import { verifyJwt } from "@/middleware/auth";

const TEST_SECRET = "test-secret-key-for-jwt-verification";

/**
 * テスト用JWTを生成
 */
async function createTestJwt(
	payload: Record<string, unknown>,
	secret: string,
	header?: Record<string, unknown>,
): Promise<string> {
	const h = header ?? { alg: "HS256", typ: "JWT" };
	const headerB64 = base64UrlEncode(
		new TextEncoder().encode(JSON.stringify(h)),
	);
	const payloadB64 = base64UrlEncode(
		new TextEncoder().encode(JSON.stringify(payload)),
	);
	const data = `${headerB64}.${payloadB64}`;

	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(data),
	);
	const sigB64 = base64UrlEncode(new Uint8Array(sig));
	return `${data}.${sigB64}`;
}

/**
 * 有効なペイロードを生成
 */
function validPayload(): Record<string, unknown> {
	return {
		sub: "user-123",
		email: "test@example.com",
		name: "Test User",
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + 3600, // 1時間後に期限切れ
	};
}

describe("verifyJwt", () => {
	it("正しいトークンを検証してペイロードを返す", async () => {
		const payload = validPayload();
		const token = await createTestJwt(payload, TEST_SECRET);

		const result = await verifyJwt(token, TEST_SECRET);

		expect(result).not.toBeNull();
		expect(result?.sub).toBe("user-123");
		expect(result?.email).toBe("test@example.com");
		expect(result?.name).toBe("Test User");
	});

	it("期限切れトークンはnullを返す", async () => {
		const payload = {
			...validPayload(),
			exp: Math.floor(Date.now() / 1000) - 3600, // 1時間前に期限切れ
		};
		const token = await createTestJwt(payload, TEST_SECRET);

		const result = await verifyJwt(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it("alg=none攻撃（CVE-2015-9235）を拒否する", async () => {
		const payload = validPayload();
		const header = { alg: "none", typ: "JWT" };
		const headerB64 = base64UrlEncode(
			new TextEncoder().encode(JSON.stringify(header)),
		);
		const payloadB64 = base64UrlEncode(
			new TextEncoder().encode(JSON.stringify(payload)),
		);
		const token = `${headerB64}.${payloadB64}.`;

		const result = await verifyJwt(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it("署名を改ざんしたトークンはnullを返す", async () => {
		const token = await createTestJwt(validPayload(), TEST_SECRET);
		const parts = token.split(".");

		// ペイロードを改ざん
		const tamperedPayload = {
			...validPayload(),
			sub: "admin",
		};
		const tamperedPayloadB64 = base64UrlEncode(
			new TextEncoder().encode(JSON.stringify(tamperedPayload)),
		);
		const tamperedToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;

		const result = await verifyJwt(tamperedToken, TEST_SECRET);
		expect(result).toBeNull();
	});

	it("subフィールドがないトークンはnullを返す", async () => {
		const payload = validPayload();
		const { sub: _, ...payloadWithoutSub } = payload;
		const token = await createTestJwt(payloadWithoutSub, TEST_SECRET);

		const result = await verifyJwt(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it("expフィールドがないトークンはnullを返す", async () => {
		const payload = validPayload();
		const { exp: _, ...payloadWithoutExp } = payload;
		const token = await createTestJwt(payloadWithoutExp, TEST_SECRET);

		const result = await verifyJwt(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it("空文字のsubフィールドはnullを返す", async () => {
		const payload = { ...validPayload(), sub: "" };
		const token = await createTestJwt(payload, TEST_SECRET);

		const result = await verifyJwt(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it("不正なトークン形式（3パート以外）はnullを返す", async () => {
		const result1 = await verifyJwt("only-one-part", TEST_SECRET);
		expect(result1).toBeNull();

		const result2 = await verifyJwt("two.parts", TEST_SECRET);
		expect(result2).toBeNull();

		const result4 = await verifyJwt("four.parts.here.extra", TEST_SECRET);
		expect(result4).toBeNull();
	});

	it("RS256アルゴリズムのトークンはnullを返す", async () => {
		const payload = validPayload();
		// HS256で署名するがヘッダーをRS256に偽装
		const token = await createTestJwt(payload, TEST_SECRET, {
			alg: "RS256",
			typ: "JWT",
		});

		const result = await verifyJwt(token, TEST_SECRET);
		expect(result).toBeNull();
	});

	it("異なるシークレットで署名されたトークンはnullを返す", async () => {
		const token = await createTestJwt(validPayload(), "different-secret-key");

		const result = await verifyJwt(token, TEST_SECRET);
		expect(result).toBeNull();
	});
});
