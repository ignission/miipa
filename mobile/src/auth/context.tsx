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
 * Mobile 用 Google OAuth フック（実際にHookを呼び出す）
 */
function useNativeGoogleAuth(): GoogleAuthHook {
	const Google = require("expo-auth-session/providers/google");
	const WebBrowser = require("expo-web-browser");
	WebBrowser.maybeCompleteAuthSession();

	return Google.useIdTokenAuthRequest({
		iosClientId: AUTH_CONFIG.googleIosClientId,
		webClientId: AUTH_CONFIG.googleWebClientId,
	});
}

/**
 * Web 用 no-op フック
 */
function useWebGoogleAuth(): GoogleAuthHook {
	return [null, null, async () => {}];
}

/**
 * プラットフォームに応じた Google OAuth フックを選択
 *
 * Platform.OS は実行時に固定値のため、Hookの呼び出し順序は変わらない
 */
const useMobileGoogleAuth =
	Platform.OS === "web" ? useWebGoogleAuth : useNativeGoogleAuth;

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
	/** 認証情報を保存してステートを更新（auth-callback用） */
	login: (
		token: string,
		user: StoredUser,
		refreshToken?: string,
	) => Promise<void>;
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

/** バッファ秒数（期限切れ判定を早めに行う） */
const TOKEN_EXPIRY_BUFFER_SECONDS = 30;

/**
 * Base64URLエンコードされた文字列をデコードする
 */
function decodeBase64Url(input: string): string {
	let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
	const pad = base64.length % 4;
	if (pad === 2) base64 += "==";
	else if (pad === 3) base64 += "=";
	return atob(base64);
}

/**
 * JWTペイロードをデコードして有効期限切れかチェック
 */
function isTokenExpired(token: string): boolean {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return true;

		const decoded = JSON.parse(decodeBase64Url(parts[1])) as {
			exp?: number;
		};
		if (!decoded.exp) return true;

		const now = Math.floor(Date.now() / 1000);
		return decoded.exp - TOKEN_EXPIRY_BUFFER_SECONDS < now;
	} catch {
		return true;
	}
}

/**
 * Web用: Cookie ベースでリフレッシュトークンを送信
 */
async function refreshOnWeb(): Promise<boolean> {
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

		if (!res.ok) return false;

		const data = (await res.json()) as {
			token: string;
			user: StoredUser;
		};

		await Promise.all([saveToken(data.token), saveUser(data.user)]);
		return true;
	} catch {
		return false;
	}
}

/**
 * Mobile用: SecureStore のリフレッシュトークンで新しいアクセストークンを取得
 */
async function refreshOnMobile(): Promise<boolean> {
	const refreshToken = await getRefreshToken();
	if (!refreshToken) return false;

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

		if (!res.ok) return false;

		const data = (await res.json()) as {
			token: string;
			refreshToken: string;
			user: StoredUser;
		};

		await Promise.all([
			saveToken(data.token),
			saveRefreshToken(data.refreshToken),
			saveUser(data.user),
		]);
		return true;
	} catch {
		return false;
	}
}

/**
 * プラットフォームに応じたリフレッシュ処理を実行
 */
async function refreshWithStoredToken(): Promise<boolean> {
	return Platform.OS === "web" ? refreshOnWeb() : refreshOnMobile();
}

/**
 * ストレージからトークンとユーザー情報を読み込む
 *
 * @returns トークンとユーザーのペア。いずれかが欠けている場合は null
 */
async function loadStoredAuth(): Promise<{
	token: string;
	user: StoredUser;
} | null> {
	const [token, user] = await Promise.all([getToken(), getUser()]);
	if (!token || !user) return null;
	return { token, user };
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

	/**
	 * リフレッシュ後のトークンをストレージから読み込み、ステートに反映する
	 */
	const applyRefreshedAuth = useCallback(async () => {
		const auth = await loadStoredAuth();
		if (auth) {
			setToken(auth.token);
			setUser(auth.user);
		}
	}, []);

	// 起動時にトークンを復元（有効期限切れの場合はリフレッシュ）
	useEffect(() => {
		(async () => {
			try {
				const stored = await loadStoredAuth();

				// トークン未保存: Web のみ Cookie ベースでリフレッシュを試行
				if (!stored) {
					if (Platform.OS === "web") {
						const refreshed = await refreshWithStoredToken();
						if (refreshed) await applyRefreshedAuth();
					}
					return;
				}

				// トークンが有効ならそのまま復元
				if (!isTokenExpired(stored.token)) {
					setToken(stored.token);
					setUser(stored.user);
					return;
				}

				// トークン期限切れ: リフレッシュを試行
				const refreshed = await refreshWithStoredToken();
				if (refreshed) {
					await applyRefreshedAuth();
				} else {
					// リフレッシュ失敗: ログアウト状態にする
					await Promise.all([
						deleteToken(),
						deleteRefreshToken(),
						deleteUser(),
					]);
				}
			} finally {
				setIsLoading(false);
			}
		})();
	}, [applyRefreshedAuth]);

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

				// リダイレクト先のホスト名を検証（Open Redirect 対策: CWE-601）
				const authUrlObj = new URL(data.authUrl);
				if (authUrlObj.hostname !== "accounts.google.com") {
					throw new Error("不正なリダイレクトURL");
				}

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
	 * 認証情報をストレージに保存し、React ステートも同時に更新する
	 *
	 * auth-callback 画面など、AuthProvider 外部で取得したトークンを
	 * コンテキストに反映させるために使用する。
	 */
	const login = useCallback(
		async (newToken: string, newUser: StoredUser, refreshToken?: string) => {
			// ストレージに保存
			const savePromises: Promise<void>[] = [
				saveToken(newToken),
				saveUser(newUser),
			];
			// Mobile のみ: リフレッシュトークンを SecureStore に保存
			if (Platform.OS !== "web" && refreshToken) {
				savePromises.push(saveRefreshToken(refreshToken));
			}
			await Promise.all(savePromises);

			// React ステートを更新
			setToken(newToken);
			setUser(newUser);
		},
		[],
	);

	/**
	 * ログアウト実行
	 *
	 * Web: Hono API のログアウトエンドポイントを呼び出し（Cookie削除）
	 * Mobile: ローカルストレージのトークンを削除
	 */
	const signOut = useCallback(async () => {
		if (Platform.OS === "web") {
			try {
				await fetch(`${AUTH_CONFIG.apiBaseUrl}${AUTH_CONFIG.logoutEndpoint}`, {
					method: "POST",
					credentials: "include",
				});
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
			login,
		}),
		[isLoading, isSigningIn, user, token, signIn, signOut, login],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
