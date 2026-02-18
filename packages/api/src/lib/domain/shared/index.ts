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
	/** 失敗を表す型 */
	Err,
	/** パターンマッチング用インターフェース */
	MatchPattern,
	/** 成功を表す型 */
	Ok,
	/** 成功または失敗を表す結果型 */
	Result,
} from "./result";

export {
	// 合成関数
	/** 複数のResultをすべて成功した場合のみ成功を返す */
	all,
	/** タプル型用のall関数（型を保持） */
	allTuple,
	/** 失敗結果を生成 */
	err,
	/** 成功時の値を変換し、ネストを平坦化 */
	flatMap,
	/** nullableな値をResultに変換 */
	fromNullable,
	/** Promiseを Result に変換 */
	fromPromise,
	/** Resultが失敗（Err）かどうかを判定 */
	isErr,
	// 型ガード
	/** Resultが成功（Ok）かどうかを判定 */
	isOk,
	// 変換関数
	/** 成功時の値を変換 */
	map,
	/** 失敗時のエラーを変換 */
	mapErr,
	/** Resultのパターンマッチング */
	match,
	// コンストラクタ
	/** 成功結果を生成 */
	ok,
	// メソッドチェーン用ラッパー
	/** メソッドチェーン可能なResultラッパークラス */
	ResultBox,
	/** 例外をスローする可能性のある関数をResultに変換 */
	tryCatch,
	// ユーティリティ関数
	/** 成功時の値を取り出す（失敗時は例外） */
	unwrap,
	/** 成功時の値を取り出す（失敗時はデフォルト値） */
	unwrapOr,
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
	/** 値が存在しないことを表す型 */
	None,
	/** 値の存在または不在を表すオプション型 */
	Option,
	/** Option用パターンマッチングインターフェース */
	OptionMatchPattern,
	/** 値が存在することを表す型 */
	Some,
} from "./option";

export {
	// 合成関数
	/** 複数のOptionをすべてSomeの場合のみSomeを返す */
	all as optionAll,
	/** タプル型用のall関数（型を保持） */
	allTuple as optionAllTuple,
	/** 条件を満たす値のみを保持 */
	filter,
	/** 最初のSomeを返す */
	firstSome,
	/** Someの値を変換し、ネストを平坦化 */
	flatMap as optionFlatMap,
	/** nullまたはundefinedをOptionに変換 */
	fromNullable as optionFromNullable,
	/** ResultをOptionに変換 */
	fromResult,
	/** OptionがNoneかどうかを判定 */
	isNone,
	// 型ガード
	/** OptionがSomeかどうかを判定 */
	isSome,
	// 変換関数
	/** Someの値を変換 */
	map as optionMap,
	/** Optionのパターンマッチング */
	match as optionMatch,
	/** 値を持たないOptionを生成 */
	none,
	// メソッドチェーン用ラッパー
	/** メソッドチェーン可能なOptionラッパークラス */
	OptionBox,
	// コンストラクタ
	/** 値を持つOptionを生成 */
	some,
	// Result との相互変換
	/** OptionをResultに変換 */
	toResult,
	// ユーティリティ関数
	/** Someの値を取り出す（Noneの場合は例外） */
	unwrap as optionUnwrap,
	/** Someの値を取り出す（Noneの場合はデフォルト値） */
	unwrapOr as optionUnwrapOr,
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
	/** アプリケーションエラーの基底インターフェース */
	AppError,
	/** 設定関連エラー */
	ConfigError,
	/** 設定エラーコードの型定義 */
	ConfigErrorCode,
	/** ファイルシステムエラー */
	FileSystemError,
	/** ファイルシステムエラーコードの型定義 */
	FileSystemErrorCode,
	/** macOS Keychain操作エラー */
	KeychainError,
	/** Keychainエラーコードの型定義 */
	KeychainErrorCode,
} from "./errors";

export {
	// 設定エラーファクトリ
	/** 設定ファイルが見つからないエラーを生成 */
	configNotFound,
	/** 設定ファイルのパースエラーを生成 */
	configParseError,
	/** 設定ファイルのバリデーションエラーを生成 */
	configValidationError,
	/** 設定ファイルの書き込みエラーを生成 */
	configWriteFailed,
	/** ディレクトリ作成エラーを生成 */
	directoryCreateFailed,
	// ファイルシステムエラーファクトリ
	/** ファイルが見つからないエラーを生成 */
	fileNotFound,
	/** ファイル読み込みエラーを生成 */
	fileReadFailed,
	/** ファイル書き込みエラーを生成 */
	fileWriteFailed,
	/** エラーメッセージを整形して取得 */
	formatError,
	// 型ガード
	/** ConfigErrorかどうかを判定 */
	isConfigError,
	/** FileSystemErrorかどうかを判定 */
	isFileSystemError,
	/** KeychainErrorかどうかを判定 */
	isKeychainError,
	// Keychainエラーファクトリ
	/** Keychainアクセス拒否エラーを生成 */
	keychainAccessDenied,
	/** Keychainアイテムが見つからないエラーを生成 */
	keychainItemNotFound,
	/** Keychain書き込みエラーを生成 */
	keychainWriteFailed,
	// ユーティリティ
	/** エラーをJSONシリアライズ可能なオブジェクトに変換 */
	toSerializable,
} from "./errors";

// ============================================================
// 共通型定義 - Brand型、時間範囲など
// ============================================================

/**
 * 共通型定義のエクスポート
 *
 * ドメイン全体で使用される共通型を提供します。
 * - Brand型: 型安全なID（文字列の誤用を防止）
 * - CalendarId, EventId: ブランド化されたID型
 * - TimeRange, DateRange: 時間・日付範囲
 * - NonEmptyArray: 最低1要素を保証する配列型
 */
export type {
	/** ブランド型のためのユーティリティ型 */
	Brand,
	/** カレンダーを一意に識別するためのブランド型 */
	CalendarId,
	/** 日付範囲を表すユニオン型 */
	DateRange,
	/** カレンダーイベントを一意に識別するためのブランド型 */
	EventId,
	/** 最低1つの要素を持つことが保証された配列型 */
	NonEmptyArray,
	/** 開始日時と終了日時を持つ時間範囲 */
	TimeRange,
} from "./types";

export {
	// CalendarId関連
	/** CalendarIdを作成 */
	createCalendarId,
	// EventId関連
	/** EventIdを作成 */
	createEventId,
	// TimeRange関連
	/** TimeRangeを作成 */
	createTimeRange,
	/** NonEmptyArrayの先頭要素を取得 */
	head,
	// NonEmptyArray関連
	/** 配列がNonEmptyArrayかどうかを判定する型ガード */
	isNonEmptyArray,
	// DateRange関連
	/** DateRangeがプリセット値かどうかを判定 */
	isPresetDateRange,
	/** DateRangeがTimeRangeかどうかを判定 */
	isTimeRangeDateRange,
	/** 値がCalendarIdとして有効かどうかを検証 */
	isValidCalendarId,
	/** 値がEventIdとして有効かどうかを検証 */
	isValidEventId,
	/** TimeRangeが有効かどうかを検証 */
	isValidTimeRange,
	/** NonEmptyArrayの最後の要素を取得 */
	last,
} from "./types";
