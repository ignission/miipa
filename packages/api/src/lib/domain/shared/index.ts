/**
 * ドメイン共有モジュール
 *
 * このモジュールはアプリケーション全体で使用される基盤型を提供します。
 * 関数型プログラミングパターンを採用し、型安全なコードを実現します。
 *
 * ## 提供する機能
 *
 * ### Result型
 * 成功/失敗を型で明示的に表現し、例外スローを避けることで型安全なエラーハンドリングを実現します。
 *
 * ### Option型
 * null/undefinedの代わりに値の有無を型で表現し、安全な値アクセスを提供します。
 *
 * ### エラー型
 * アプリケーション共通のエラー型を定義し、一貫したエラーハンドリングを可能にします。
 *
 * ### Brand型・共通型
 * CalendarId、EventIdなどの型安全なIDと、TimeRange、DateRangeなどの共通型を提供します。
 *
 * @module lib/domain/shared
 *
 * @example
 * ```typescript
 * import {
 *   // Result型
 *   ok, err, isOk, isErr, map, flatMap,
 *   // Option型
 *   some, none, isSome, isNone,
 *   // エラー型
 *   configNotFound, isConfigError,
 *   // 共通型
 *   createCalendarId, createEventId,
 *   type CalendarId, type EventId, type TimeRange,
 * } from '@/lib/domain/shared';
 * ```
 */

// ============================================================
// Result型 - 成功/失敗を明示的に型で表現
// ============================================================

/**
 * Result型のエクスポート
 *
 * 関数型プログラミングのResult/Either型パターンを実装。
 * 成功（Ok）と失敗（Err）を型で明示的に表現します。
 */
export type {
	/** 成功または失敗を表す結果型 */
	Result,
} from "./result";

export {
	/** 失敗結果を生成 */
	err,
	/** Resultが失敗（Err）かどうかを判定 */
	isErr,
	/** Resultが成功（Ok）かどうかを判定 */
	isOk,
	/** 成功結果を生成 */
	ok,
} from "./result";

// ============================================================
// Option型 - 値の有無を型で表現
// ============================================================

/**
 * Option型のエクスポート
 *
 * 関数型プログラミングのOption/Maybe型パターンを実装。
 * 値の存在（Some）と不在（None）を型で明示的に表現します。
 */
export type {
	/** 値の存在または不在を表すオプション型 */
	Option,
} from "./option";

export {
	/** OptionがSomeかどうかを判定 */
	isSome,
	/** 値を持たないOptionを生成 */
	none,
	/** 値を持つOptionを生成 */
	some,
} from "./option";

// ============================================================
// エラー型 - アプリケーション共通エラー
// ============================================================

/**
 * エラー型のエクスポート
 *
 * アプリケーション全体で使用する共通エラー型を定義。
 * discriminated union パターンによる型安全なエラーハンドリングを実現します。
 */
export type {
	/** 設定関連エラー */
	ConfigError,
} from "./errors";
