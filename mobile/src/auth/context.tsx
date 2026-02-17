import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { ReactNode } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { AUTH_CONFIG } from "./config";
import {
	deleteToken,
	deleteRefreshToken,
	deleteUser,
	getToken,
	getRefreshToken,
	getUser,
	saveToken,
	saveRefreshToken,
	saveUser,
} from "./storage";
import type { StoredUser } from "./storage";

WebBrowser.maybeCompleteAuthSession();

interface AuthState {
	/** 認証済みかどうか */
	isAuthenticated: boolean;
	/** 初期化中かどうか */
	isLoading: boolean;
	/** ログイン中かどうか */
	isSigningIn: boolean;
	/** 認証済みユーザー */
	user: StoredUser | null;
	/** JWTトークン */
	token: string | null;
	/** Googleログイン実行 */
	signIn: () => Promise<void>;
	/** ログアウト実行 */
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * 認証コンテキストを使用するフック
 */
export function useAuth(): AuthState {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth は AuthProvider 内で使用してください");
	}
	return context;
}

/**
 * JWTペイロードをデコードして有効期限切れかチェック
 *
 * @param token - JWT文字列
 * @returns 期限切れならtrue
 */
function isTokenExpired(token: string): boolean {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) {
			return true;
		}
		// Base64URLデコード（文字置換とパディング補完）
		let payload = parts[1]
			.replace(/-/g, "+")
			.replace(/_/g, "/");
		const pad = payload.length % 4;
		if (pad === 2) payload += "==";
		else if (pad === 3) payload += "=";
		const decoded = JSON.parse(atob(payload)) as { exp?: number };

		if (!decoded.exp) {
			return true;
		}

		// 期限の30秒前をバッファとして持たせる
		return decoded.exp - 30 < Math.floor(Date.now() / 1000);
	} catch {
		return true;
	}
}

/**
 * SecureStoreに保存されたリフレッシュトークンで新しいアクセストークンを取得
 *
 * @returns 成功ならtrue
 */
async function refreshWithStoredToken(): Promise<boolean> {
	const refreshToken = await getRefreshToken();
	if (!refreshToken) {
		return false;
	}

	try {
		const res = await fetch(
			`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.tokenEndpoint}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					grantType: "refresh_token",
					refreshToken,
				}),
			},
		);

		if (!res.ok) {
			return false;
		}

		const data = await res.json();
		const {
			token: newJwt,
			refreshToken: newRefreshToken,
			user: userData,
		} = data as {
			token: string;
			refreshToken: string;
			user: StoredUser;
		};

		await Promise.all([
			saveToken(newJwt),
			saveRefreshToken(newRefreshToken),
			saveUser(userData),
		]);

		return true;
	} catch {
		return false;
	}
}

interface AuthProviderProps {
	children: ReactNode;
}

/**
 * 認証プロバイダー
 */
export function AuthProvider({ children }: AuthProviderProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [user, setUser] = useState<StoredUser | null>(null);
	const [token, setToken] = useState<string | null>(null);

	// Google OAuth設定（iOS用Client ID + Web用Client IDでIDトークンを取得）
	const [_request, response, promptAsync] = Google.useIdTokenAuthRequest({
		iosClientId: AUTH_CONFIG.googleIosClientId,
		webClientId: AUTH_CONFIG.googleWebClientId,
	});

	// 起動時にトークンを復元（有効期限切れの場合はリフレッシュ）
	useEffect(() => {
		(async () => {
			try {
				const [savedToken, savedUser] = await Promise.all([
					getToken(),
					getUser(),
				]);

				if (!savedToken || !savedUser) {
					return;
				}

				// JWTの有効期限をチェック
				if (isTokenExpired(savedToken)) {
					// リフレッシュトークンで新しいアクセストークンを取得
					const refreshed = await refreshWithStoredToken();
					if (!refreshed) {
						// リフレッシュ失敗: ログアウト状態にする
						await Promise.all([
							deleteToken(),
							deleteRefreshToken(),
							deleteUser(),
						]);
						return;
					}

					// リフレッシュ成功: 新しいトークンとユーザー情報を設定
					const [newToken, newUser] = await Promise.all([
						getToken(),
						getUser(),
					]);
					if (newToken && newUser) {
						setToken(newToken);
						setUser(newUser);
					}
					return;
				}

				setToken(savedToken);
				setUser(savedUser);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	/**
	 * Google ID Token をバックエンドのJWTに交換
	 */
	const exchangeToken = useCallback(async (idToken: string) => {
		try {
			const res = await fetch(
				`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.tokenEndpoint}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ idToken }),
				},
			);

			if (!res.ok) {
				throw new Error(`トークン交換失敗: ${res.status}`);
			}

			const data = await res.json();
			const {
				token: jwt,
				refreshToken: newRefreshToken,
				user: userData,
			} = data as {
				token: string;
				refreshToken: string;
				user: StoredUser;
			};

			await Promise.all([
				saveToken(jwt),
				saveRefreshToken(newRefreshToken),
				saveUser(userData),
			]);
			setToken(jwt);
			setUser(userData);
		} catch (error) {
			console.error("[auth] トークン交換エラー:", error);
		} finally {
			setIsSigningIn(false);
		}
	}, []);

	// Google OAuth レスポンス処理
	useEffect(() => {
		if (response?.type === "success") {
			const { id_token: idToken } = response.params;
			if (idToken) {
				exchangeToken(idToken);
			} else {
				// id_tokenが取得できなかった場合、ローディング状態を解除
				setIsSigningIn(false);
			}
		}
		if (response?.type === "error" || response?.type === "dismiss") {
			setIsSigningIn(false);
		}
	}, [response, exchangeToken]);

	const signIn = useCallback(async () => {
		setIsSigningIn(true);
		try {
			await promptAsync();
		} catch {
			// promptAsync()が例外をスローした場合、ローディング状態を解除
			setIsSigningIn(false);
		}
	}, [promptAsync]);

	const signOut = useCallback(async () => {
		await Promise.all([deleteToken(), deleteRefreshToken(), deleteUser()]);
		setToken(null);
		setUser(null);
	}, []);

	const value = useMemo<AuthState>(
		() => ({
			isAuthenticated: !!token && !!user,
			isLoading,
			isSigningIn,
			user,
			token,
			signIn,
			signOut,
		}),
		[isLoading, isSigningIn, user, token, signIn, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
