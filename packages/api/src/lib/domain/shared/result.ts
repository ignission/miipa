/**
 * Result型モジュール
 *
 * 関数型プログラミングのResult/Either型パターンを実装。
 * 成功（Ok）と失敗（Err）を型で明示的に表現し、例外スローを避けることで
 * 型安全なエラーハンドリングを実現します。
 *
 * @module lib/domain/shared/result
 * @example
 * ```typescript
 * // 基本的な使い方
 * const result = ok(42);
 * if (isOk(result)) {
 *   console.log(result.value); // 42
 * }
 *
 * // チェーン処理
 * const doubled = result
 *   .pipe(map(x => x * 2))
 *   .pipe(flatMap(x => x > 50 ? err('too large') : ok(x)));
 *
 * // パターンマッチング
 * const message = match(result, {
 *   ok: value => `成功: ${value}`,
 *   err: error => `失敗: ${error}`,
 * });
 * ```
 */

// ============================================================
// 型定義
// ============================================================

/**
 * 成功を表す型
 *
 * @typeParam T - 成功時の値の型
 */
export interface Ok<T> {
	/** 型識別用タグ（discriminated union用） */
	readonly _tag: "Ok";
	/** 成功時の値 */
	readonly value: T;
}

/**
 * 失敗を表す型
 *
 * @typeParam E - エラーの型
 */
export interface Err<E> {
	/** 型識別用タグ（discriminated union用） */
	readonly _tag: "Err";
	/** エラー値 */
	readonly error: E;
}

/**
 * 成功または失敗を表す結果型
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return err('ゼロで割ることはできません');
 *   }
 *   return ok(a / b);
 * }
 * ```
 */
export type Result<T, E> = Ok<T> | Err<E>;

// ============================================================
// コンストラクタ
// ============================================================

/**
 * 成功結果を生成
 *
 * @typeParam T - 成功時の値の型
 * @param value - 成功時の値
 * @returns Ok型のResult
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * // result: Ok<number> = { _tag: 'Ok', value: 42 }
 * ```
 */
export function ok<T>(value: T): Ok<T> {
	return { _tag: "Ok", value } as const;
}

/**
 * 失敗結果を生成
 *
 * @typeParam E - エラーの型
 * @param error - エラー値
 * @returns Err型のResult
 *
 * @example
 * ```typescript
 * const result = err('エラーが発生しました');
 * // result: Err<string> = { _tag: 'Err', error: 'エラーが発生しました' }
 * ```
 */
export function err<E>(error: E): Err<E> {
	return { _tag: "Err", error } as const;
}

// ============================================================
// 型ガード
// ============================================================

/**
 * Result が成功（Ok）かどうかを判定
 *
 * 型ガードとして機能し、trueの場合はResultがOk<T>に絞り込まれます。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @param result - 判定対象のResult
 * @returns 成功の場合はtrue
 *
 * @example
 * ```typescript
 * const result: Result<number, string> = ok(42);
 * if (isOk(result)) {
 *   // result は Ok<number> 型に絞り込まれる
 *   console.log(result.value); // 42
 * }
 * ```
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
	return result._tag === "Ok";
}

/**
 * Result が失敗（Err）かどうかを判定
 *
 * 型ガードとして機能し、trueの場合はResultがErr<E>に絞り込まれます。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @param result - 判定対象のResult
 * @returns 失敗の場合はtrue
 *
 * @example
 * ```typescript
 * const result: Result<number, string> = err('エラー');
 * if (isErr(result)) {
 *   // result は Err<string> 型に絞り込まれる
 *   console.log(result.error); // 'エラー'
 * }
 * ```
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
	return result._tag === "Err";
}
