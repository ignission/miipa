import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { Platform } from "react-native";
import { AUTH_CONFIG } from "./config";
import type { StoredUser } from "./storage";
import {
	deleteRefreshToken,
	deleteToken,
	deleteUser,
	getRefreshToken,
	getToken,
	getUser,
	saveRefreshToken,
	saveToken,
	saveUser,
} from "./storage";

// ============================================================
// Mobile 専用モジュール: Web では読み込まない
// ============================================================

type GoogleAuthHook = [
	unknown,
	{ type: string; params: Record<string, string> } | null,
	() => Promise<unknown>,
];

/**
 * Mobile 用 Google OAuth フック（Web では no-op）
 */
function useMobileGoogleAuth(): GoogleAuthHook {
	if (Platform.OS === "web") {
		// Web では expo-auth-session を使わない
		return [null, null, async () => {}];
	}

	// Mobile 環境でのみ動的に require
	// biome-ignore lint: Web では到達しないため動的 require が必要
	const Google = require("expo-auth-session/providers/google");
	// biome-ignore lint: Web では到達しないため動的 require が必要
	const WebBrowser = require("expo-web-browser");
	WebBrowser.maybeCompleteAuthSession();

	return Google.useIdTokenAuthRequest({
		iosClientId: AUTH_CONFIG.googleIosClientId,
		webClientId: AUTH_CONFIG.googleWebClientId,
	});
}

// ============================================================
// 型定義
// ============================================================

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

// ============================================================
// ユーティリティ関数
// ============================================================

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
		let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
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
 * ストレージに保存されたリフレッシュトークンで新しいアクセストークンを取得
 *
 * Web: Cookie + Body でリフレッシュ（credentials: "include" で httpOnly Cookie を自動送信）
 * Mobile: Body にリフレッシュトークンを含めて送信
 *
 * @returns 成功ならtrue
 */
async function refreshWithStoredToken(): Promise<boolean> {
	// Web: Cookie ベースのリフレッシュを優先（Hono の /auth/refresh エンドポイント使用）
	if (Platform.OS === "web") {
		try {
			const res = await fetch(
				`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.refreshEndpoint}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({}),
				},
			);

			if (!res.ok) {
				return false;
			}

			const data = await res.json();
			const { token: newJwt, user: userData } = data as {
				token: string;
				refreshToken: string;
				user: StoredUser;
			};

			// メモリにアクセストークンとユーザー情報を保存
			// リフレッシュトークンは httpOnly Cookie でHonoが管理するため保存不要
			await Promise.all([saveToken(newJwt), saveUser(userData)]);

			return true;
		} catch {
			return false;
		}
	}

	// Mobile: SecureStore のリフレッシュトークンを使用
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

// ============================================================
// AuthProvider
// ============================================================

interface AuthProviderProps {
	children: ReactNode;
}

/**
 * 認証プロバイダー
 *
 * Web/Mobile 統一の認証コンテキストを提供:
 * - Web: Hono API の Google OAuth フロー（リダイレクト方式）
 * - Mobile: expo-auth-session による Google ID Token 取得 + JWT交換
 */
export function AuthProvider({ children }: AuthProviderProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [user, setUser] = useState<StoredUser | null>(null);
	const [token, setToken] = useState<string | null>(null);

	// Mobile: Google OAuth設定（iOS用Client ID + Web用Client IDでIDトークンを取得）
	// Web: no-op フック
	const [_request, response, promptAsync] = useMobileGoogleAuth();

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
	 * Google ID Token をバックエンドのJWTに交換（Mobile用）
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

	// Mobile: Google OAuth レスポンス処理
	useEffect(() => {
		if (Platform.OS === "web") return;

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

	/**
	 * ログイン実行
	 *
	 * Web: Hono API に Google OAuth URL を取得してブラウザリダイレクト
	 * Mobile: expo-auth-session で Google ID Token を取得
	 */
	const signIn = useCallback(async () => {
		if (Platform.OS === "web") {
			setIsSigningIn(true);
			try {
				const res = await fetch(
					`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.googleAuthEndpoint}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify({}),
					},
				);

				if (!res.ok) {
					throw new Error(`OAuth URL取得失敗: ${res.status}`);
				}

				const data = (await res.json()) as { authUrl: string };
				// Google OAuth 画面にリダイレクト
				window.location.href = data.authUrl;
			} catch (error) {
				console.error("[auth] Web OAuth開始エラー:", error);
				setIsSigningIn(false);
			}
			return;
		}

		// Mobile: expo-auth-session
		setIsSigningIn(true);
		try {
			await promptAsync();
		} catch {
			// promptAsync()が例外をスローした場合、ローディング状態を解除
			setIsSigningIn(false);
		}
	}, [promptAsync]);

	/**
	 * ログアウト実行
	 *
	 * Web: Hono API のログアウトエンドポイントを呼び出し（Cookie削除）
	 * Mobile: ローカルストレージのトークンを削除
	 */
	const signOut = useCallback(async () => {
		if (Platform.OS === "web") {
			try {
				await fetch(
					`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.logoutEndpoint}`,
					{
						method: "POST",
						credentials: "include",
					},
				);
			} catch (error) {
				console.error("[auth] ログアウトAPIエラー:", error);
			}
		}

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
