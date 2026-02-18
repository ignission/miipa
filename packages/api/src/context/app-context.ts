import type { Context } from "hono";

/** Cloudflare Workers バインディング */
export type Bindings = {
	DB: D1Database;
	ENCRYPTION_KEY: string;
	MOBILE_JWT_SECRET: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_IOS_CLIENT_ID: string;
	ENVIRONMENT: string;
};

/** リクエストコンテキスト変数 */
export type Variables = {
	userId: string;
	db: D1Database;
	encryptionKey: string;
};

/** Hono アプリケーション型 */
export type AppType = {
	Bindings: Bindings;
	Variables: Variables;
};

/** 認証済みコンテキスト型 */
export type AuthenticatedContext = Context<AppType>;
