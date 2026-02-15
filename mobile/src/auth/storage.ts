import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "miipa_jwt_token";
const USER_KEY = "miipa_user";

export interface StoredUser {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
}

/**
 * JWTトークンを安全に保存
 */
export async function saveToken(token: string): Promise<void> {
	await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * JWTトークンを取得
 */
export async function getToken(): Promise<string | null> {
	return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * JWTトークンを削除
 */
export async function deleteToken(): Promise<void> {
	await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * ユーザー情報を保存
 */
export async function saveUser(user: StoredUser): Promise<void> {
	await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

/**
 * ユーザー情報を取得
 */
export async function getUser(): Promise<StoredUser | null> {
	const raw = await SecureStore.getItemAsync(USER_KEY);
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
	await SecureStore.deleteItemAsync(USER_KEY);
}
