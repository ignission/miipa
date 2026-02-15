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
	deleteUser,
	getToken,
	getUser,
	saveToken,
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

	// Google OAuth設定
	const [_request, response, promptAsync] = Google.useIdTokenAuthRequest({
		clientId: AUTH_CONFIG.googleClientId,
	});

	// 起動時にトークンを復元
	useEffect(() => {
		(async () => {
			try {
				const [savedToken, savedUser] = await Promise.all([
					getToken(),
					getUser(),
				]);
				if (savedToken && savedUser) {
					setToken(savedToken);
					setUser(savedUser);
				}
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	// Google OAuth レスポンス処理
	useEffect(() => {
		if (response?.type === "success") {
			const { id_token: idToken } = response.params;
			if (idToken) {
				exchangeToken(idToken);
			}
		}
		if (response?.type === "error" || response?.type === "dismiss") {
			setIsSigningIn(false);
		}
	}, [response]);

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
			const { token: jwt, user: userData } = data as {
				token: string;
				user: StoredUser;
			};

			await Promise.all([saveToken(jwt), saveUser(userData)]);
			setToken(jwt);
			setUser(userData);
		} catch (error) {
			console.error("[auth] トークン交換エラー:", error);
		} finally {
			setIsSigningIn(false);
		}
	}, []);

	const signIn = useCallback(async () => {
		setIsSigningIn(true);
		await promptAsync();
	}, [promptAsync]);

	const signOut = useCallback(async () => {
		await Promise.all([deleteToken(), deleteUser()]);
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
