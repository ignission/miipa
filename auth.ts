import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Auth.js v5 フル設定
 *
 * authConfigを拡張し、signInコールバックでカレンダー自動セットアップを実行。
 * googleapis等の重い依存は動的importで遅延読み込みする。
 *
 * middleware.ts はこのファイルをimportせず auth.config.ts を使用するため、
 * Edgeバンドルに重い依存が含まれない。
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
	...authConfig,
	callbacks: {
		...authConfig.callbacks,
		async signIn({ user, account }) {
			if (account?.provider === "google" && account.access_token) {
				try {
					const { autoSetupCalendars } = await import(
						"@/lib/application/calendar/auto-setup-calendars"
					);
					await autoSetupCalendars(
						user.id ?? account.providerAccountId,
						user.email ?? "",
						account.access_token,
						account.refresh_token ?? "",
						account.expires_at,
					);
				} catch (e) {
					console.error("[auth] カレンダー自動セットアップ失敗:", e);
				}
			}
			return true;
		},
	},
}));
