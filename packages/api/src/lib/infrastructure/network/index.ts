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
	readResponseWithSizeLimit,
} from "./ssrf-guard";
