/**
 * ネットワークセキュリティモジュール
 *
 * SSRF対策やレスポンスサイズ制限など、
 * 外部ネットワークアクセス時のセキュリティユーティリティを提供します。
 *
 * @module lib/infrastructure/network
 */

export {
	isInternalHost,
	MAX_RESPONSE_SIZE_BYTES,
	readResponseWithSizeLimit,
} from "./ssrf-guard";
