/**
 * シークレット管理モジュール公開API
 *
 * D1データベースを使用したマルチテナント対応の暗号化シークレット管理機能を提供します。
 * Web Crypto API（AES-256-GCM）で暗号化し、ユーザーごとにシークレットを分離管理します。
 *
 * @module lib/infrastructure/secret
 * @example
 * ```typescript
 * import {
 *   type LLMSecretKey,
 * } from '@/lib/infrastructure/secret';
 *
 * const key: LLMSecretKey = 'anthropic-api-key';
 * ```
 */

// ============================================================
// 型定義
// ============================================================

export type {
	/** LLMプロバイダ用シークレットキー */
	LLMSecretKey,
} from "./types";
