import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js v5 共通設定（軽量版）
 *
 * Edge Middlewareで使用する軽量な設定。
 * googleapis等の重い依存を含まない。
 */
export const authConfig: NextAuthConfig = {
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			authorization: {
				params: {
					scope: [
						"openid",
						"email",
						"profile",
						"https://www.googleapis.com/auth/calendar.readonly",
					].join(" "),
					access_type: "offline",
					prompt: "consent",
				},
			},
		}),
	],
	secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
	trustHost: true,
	session: { strategy: "jwt" },
	callbacks: {
		async jwt({ token, user, account }) {
			if (user) {
				token.id = user.id;
			}
			if (account) {
				token.accessToken = account.access_token;
				token.refreshToken = account.refresh_token;
			}
			return token;
		},
		async session({ session, token }) {
			session.user = {
				...session.user,
				id: (token.id ?? token.sub) as string,
				name: (token.name as string) ?? null,
				email: (token.email as string) ?? null,
				image: (token.picture as string) ?? null,
			};
			return session;
		},
	},
	pages: {
		signIn: "/auth/signin",
	},
};
