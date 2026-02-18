/**
 * Base64URL エンコード/デコード ユーティリティ
 *
 * JWT処理やOAuth PKCE等で使用する Base64URL 変換関数を集約。
 * 複数ファイルでの重複実装を防止します。
 *
 * @module packages/api/src/lib/utils/base64url
 */

/**
 * Uint8Array を Base64URL 文字列にエンコード
 *
 * @param data - エンコード対象のバイナリデータ
 * @returns Base64URL エンコードされた文字列
 */
export function base64UrlEncode(data: Uint8Array): string {
	const binString = Array.from(data, (b) => String.fromCharCode(b)).join("");
	return btoa(binString)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/**
 * Base64URL 文字列を Uint8Array にデコード
 *
 * @param str - デコード対象の Base64URL 文字列
 * @returns デコードされたバイナリデータ
 */
export function base64UrlDecode(str: string): Uint8Array {
	const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(padded);
	return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
