import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import { extractBearerToken, verifyMobileJwt } from "./mobile-jwt";

/**
 * セッションまたはBearerトークンからユーザーIDを取得
 * 既存のセッション認証を優先し、なければBearerトークンをフォールバック検証
 */
export async function getUserFromRequest(
	request: Request,
): Promise<{ id: string; email?: string; name?: string } | null> {
	// 1. 既存のAuth.jsセッションを試行
	const session = await auth();
	if (session?.user?.id) {
		return {
			id: session.user.id,
			email: session.user.email ?? undefined,
			name: session.user.name ?? undefined,
		};
	}

	// 2. Bearerトークンフォールバック
	const authHeader = request.headers.get("authorization");
	const token = extractBearerToken(authHeader);
	if (!token) return null;

	const { env } = await getCloudflareContext();
	const secret = env.MOBILE_JWT_SECRET;
	if (!secret) return null;

	const payload = await verifyMobileJwt(token, secret);
	if (!payload) return null;

	return {
		id: payload.sub,
		email: payload.email,
		name: payload.name,
	};
}
