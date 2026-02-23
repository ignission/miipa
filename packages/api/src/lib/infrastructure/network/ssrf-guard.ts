/**
 * SSRF（Server-Side Request Forgery）対策ユーティリティ
 *
 * 外部URLへのリクエスト時にプライベートネットワークへのアクセスを防止します。
 * IPv4/IPv6の各種エンコーディングバイパスに対応した堅牢な検証を提供します。
 *
 * @module lib/infrastructure/network/ssrf-guard
 */

// ============================================================
// レスポンスサイズ制限
// ============================================================

/** レスポンスボディの最大サイズ（5MB） */
const MAX_RESPONSE_SIZE_BYTES = 5 * 1024 * 1024;

// ============================================================
// IPv4 プライベートアドレス判定
// ============================================================

/**
 * IPv4アドレスが内部ネットワークかを判定
 *
 * RFC 1918/RFC 6598/RFC 5737等に基づくプライベート・特殊アドレスを検出します。
 *
 * @param ip - ドット区切りのIPv4アドレス文字列
 * @returns 内部ネットワークの場合 true
 */
function isInternalIPv4(ip: string): boolean {
	const ipv4Patterns = [
		/^127\./, // ループバック (127.0.0.0/8)
		/^10\./, // クラスA プライベート (10.0.0.0/8)
		/^172\.(1[6-9]|2\d|3[01])\./, // クラスB プライベート (172.16.0.0/12)
		/^192\.168\./, // クラスC プライベート (192.168.0.0/16)
		/^169\.254\./, // リンクローカル (169.254.0.0/16)
		/^0\./, // カレントネットワーク (0.0.0.0/8)
		/^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./, // CGNAT (100.64.0.0/10, RFC 6598)
	];
	return ipv4Patterns.some((p) => p.test(ip));
}

// ============================================================
// メイン判定関数
// ============================================================

/**
 * ホスト名が内部ネットワーク（プライベートIP、ループバック等）かを判定
 *
 * SSRF（CWE-918）対策として、以下のバイパス手法を検出・拒否します:
 * - IPv6マッピングIPv4（`::ffff:127.0.0.1`）
 * - IPv6 ULA/リンクローカル（`fc00::/7`, `fe80::/10`）
 * - 10進数IP（`2130706433`）
 * - 8進数IP（`0177.0.0.1`）
 * - 16進数IP（`0x7f000001`）
 * - クラウドメタデータエンドポイント
 *
 * @param hostname - 検証対象のホスト名
 * @returns 内部ネットワークの場合 true
 */
export function isInternalHost(hostname: string): boolean {
	const lower = hostname.toLowerCase();

	// IPv6のブラケットを除去
	const cleaned = lower.replace(/^\[|\]$/g, "");

	// ループバックアドレス
	if (cleaned === "localhost" || cleaned === "::1") return true;

	// IPv6マッピングのIPv4アドレスをチェック（例: ::ffff:127.0.0.1）
	const v4mappedMatch = cleaned.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
	if (v4mappedMatch) return isInternalIPv4(v4mappedMatch[1]);

	// ::ffff: プレフィックスを持つIPv6は全て内部とみなす（hex形式のバイパス防止）
	if (/^::ffff:/i.test(cleaned)) return true;

	// IPv6 ULA (fc00::/7) とリンクローカル (fe80::/10)
	if (/^f[cd]/i.test(cleaned) || /^fe[89ab]/i.test(cleaned)) return true;

	// 16進数IPの拒否（例: 0x7f000001）
	if (/^0x[0-9a-f]+$/i.test(cleaned)) return true;

	// 10進数単独IPの拒否（例: 2130706433）
	if (/^\d+$/.test(cleaned)) return true;

	// 8進数オクテットの拒否（先頭0で始まるオクテット、例: 0177.0.0.1）
	const firstOctet = cleaned.split(".")[0] || "";
	if (firstOctet.length > 1 && /^0\d/.test(firstOctet)) return true;

	// クラウドメタデータサービス
	if (cleaned === "metadata.google.internal") return true;

	return isInternalIPv4(cleaned);
}

// ============================================================
// レスポンスサイズ制限付き読み込み
// ============================================================

/**
 * レスポンスボディをサイズ制限付きで読み込む
 *
 * Content-Lengthヘッダーによる事前チェックと、
 * ストリーミング読み込みによるフォールバックの2段階で制限を適用します。
 *
 * @param response - fetchレスポンス
 * @param maxBytes - 最大バイト数（デフォルト: MAX_RESPONSE_SIZE_BYTES）
 * @returns テキスト内容、またはサイズ超過時はnull
 */
export async function readResponseWithSizeLimit(
	response: Response,
	maxBytes: number = MAX_RESPONSE_SIZE_BYTES,
): Promise<string | null> {
	// Content-Lengthヘッダーによる事前チェック
	const contentLength = response.headers.get("content-length");
	if (contentLength !== null) {
		const size = Number.parseInt(contentLength, 10);
		if (!Number.isNaN(size) && size > maxBytes) {
			return null;
		}
	}

	// ストリーミング読み込みでサイズ制限を適用
	const reader = response.body?.getReader();
	if (!reader) {
		return null;
	}

	const chunks: Uint8Array[] = [];
	let totalSize = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			totalSize += value.byteLength;
			if (totalSize > maxBytes) {
				reader.cancel();
				return null;
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	// チャンクを結合してテキストに変換
	const combined = new Uint8Array(totalSize);
	let offset = 0;
	for (const chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.byteLength;
	}

	return new TextDecoder().decode(combined);
}
