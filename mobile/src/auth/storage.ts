import { Platform } from "react-native";

const TOKEN_KEY = "miipa_jwt_token";
const REFRESH_TOKEN_KEY = "miipa_refresh_token";
const USER_KEY = "miipa_user";

export interface StoredUser {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
}

// ============================================================
// Web用: メモリストレージ
// Web ではアクセストークンとユーザー情報をメモリに保持
// リフレッシュトークンは httpOnly Cookie で Hono API が管理するため
// フロント側では保存しない（CWE-922 対策）
// ============================================================

let webAccessToken: string | null = null;
let webUser: StoredUser | null = null;

// ============================================================
// Mobile用: expo-secure-store を動的に読み込み
// Web 環境では expo-secure-store が動作しないため条件付きインポート
// ============================================================

type SecureStoreModule = {
	getItemAsync: (key: string) => Promise<string | null>;
	setItemAsync: (key: string, value: string) => Promise<void>;
	deleteItemAsync: (key: string) => Promise<void>;
};

let _secureStore: SecureStoreModule | null = null;

/**
 * expo-secure-store を遅延読み込み（Mobile限定）
 */
async function getSecureStore(): Promise<SecureStoreModule> {
	if (_secureStore) return _secureStore;
	// require で動的に読み込むことで、Web バンドルに含まれないようにする
	_secureStore = require("expo-secure-store") as SecureStoreModule;
	return _secureStore;
}

// ============================================================
// 公開API: Platform.OS で Web/Mobile の分岐
// ============================================================

/**
 * JWTトークンを安全に保存
 */
export async function saveToken(token: string): Promise<void> {
	if (Platform.OS === "web") {
		webAccessToken = token;
		return;
	}
	const store = await getSecureStore();
	await store.setItemAsync(TOKEN_KEY, token);
}

/**
 * JWTトークンを取得
 */
export async function getToken(): Promise<string | null> {
	if (Platform.OS === "web") {
		return webAccessToken;
	}
	const store = await getSecureStore();
	return store.getItemAsync(TOKEN_KEY);
}

/**
 * JWTトークンを削除
 */
export async function deleteToken(): Promise<void> {
	if (Platform.OS === "web") {
		webAccessToken = null;
		return;
	}
	const store = await getSecureStore();
	await store.deleteItemAsync(TOKEN_KEY);
}

/**
 * リフレッシュトークンを安全に保存
 *
 * Web: httpOnly Cookie で Hono API が管理するためフロント側では保存しない
 * Mobile: SecureStore に保存
 */
export async function saveRefreshToken(token: string): Promise<void> {
	if (Platform.OS === "web") {
		// Web: httpOnly Cookie で Hono API が管理するためフロント側では保存しない
		return;
	}
	const store = await getSecureStore();
	await store.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/**
 * リフレッシュトークンを取得
 *
 * Web: httpOnly Cookie で管理されているため常に null を返す
 * Mobile: SecureStore から取得
 */
export async function getRefreshToken(): Promise<string | null> {
	if (Platform.OS === "web") {
		// Web: httpOnly Cookie で管理されているためフロント側からはアクセスしない
		return null;
	}
	const store = await getSecureStore();
	return store.getItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * リフレッシュトークンを削除
 *
 * Web: httpOnly Cookie で管理されているためフロント側では何もしない
 * Mobile: SecureStore から削除
 */
export async function deleteRefreshToken(): Promise<void> {
	if (Platform.OS === "web") {
		// Web: httpOnly Cookie で管理されているためフロント側では何もしない
		return;
	}
	const store = await getSecureStore();
	await store.deleteItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * ユーザー情報を保存
 */
export async function saveUser(user: StoredUser): Promise<void> {
	if (Platform.OS === "web") {
		webUser = user;
		return;
	}
	const store = await getSecureStore();
	await store.setItemAsync(USER_KEY, JSON.stringify(user));
}

/**
 * ユーザー情報を取得
 */
export async function getUser(): Promise<StoredUser | null> {
	if (Platform.OS === "web") {
		return webUser;
	}
	const store = await getSecureStore();
	const raw = await store.getItemAsync(USER_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as StoredUser;
	} catch {
		return null;
	}
}

/**
 * ユーザー情報を削除
 */
export async function deleteUser(): Promise<void> {
	if (Platform.OS === "web") {
		webUser = null;
		return;
	}
	const store = await getSecureStore();
	await store.deleteItemAsync(USER_KEY);
}
