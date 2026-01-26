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

// ============================================================
// 変換関数
// ============================================================

/**
 * 成功時の値を変換
 *
 * Resultが成功の場合、値に関数を適用した新しいOkを返します。
 * 失敗の場合はそのまま返します。
 *
 * @typeParam T - 元の成功時の値の型
 * @typeParam U - 変換後の成功時の値の型
 * @typeParam E - エラーの型
 * @param result - 対象のResult
 * @param fn - 変換関数
 * @returns 変換後のResult
 *
 * @example
 * ```typescript
 * const result = ok(5);
 * const doubled = map(result, x => x * 2);
 * // doubled = { _tag: 'Ok', value: 10 }
 *
 * const errResult = err('エラー');
 * const mapped = map(errResult, x => x * 2);
 * // mapped = { _tag: 'Err', error: 'エラー' } （変換されない）
 * ```
 */
export function map<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => U,
): Result<U, E> {
	if (isOk(result)) {
		return ok(fn(result.value));
	}
	return result;
}

/**
 * 成功時の値を変換し、ネストしたResultを平坦化
 *
 * Resultが成功の場合、値に関数を適用して得られたResultを返します。
 * 失敗の場合はそのまま返します。
 * mapと異なり、変換関数がResultを返す場合にネストを防ぎます。
 *
 * @typeParam T - 元の成功時の値の型
 * @typeParam U - 変換後の成功時の値の型
 * @typeParam E - エラーの型
 * @param result - 対象のResult
 * @param fn - Resultを返す変換関数
 * @returns 変換後のResult（平坦化済み）
 *
 * @example
 * ```typescript
 * function parseNumber(s: string): Result<number, string> {
 *   const n = parseInt(s, 10);
 *   return isNaN(n) ? err('数値ではありません') : ok(n);
 * }
 *
 * const result = ok('42');
 * const parsed = flatMap(result, parseNumber);
 * // parsed = { _tag: 'Ok', value: 42 }
 *
 * const invalid = ok('abc');
 * const failed = flatMap(invalid, parseNumber);
 * // failed = { _tag: 'Err', error: '数値ではありません' }
 * ```
 */
export function flatMap<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => Result<U, E>,
): Result<U, E> {
	if (isOk(result)) {
		return fn(result.value);
	}
	return result;
}

/**
 * 失敗時のエラーを変換
 *
 * Resultが失敗の場合、エラーに関数を適用した新しいErrを返します。
 * 成功の場合はそのまま返します。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - 元のエラーの型
 * @typeParam F - 変換後のエラーの型
 * @param result - 対象のResult
 * @param fn - エラー変換関数
 * @returns 変換後のResult
 *
 * @example
 * ```typescript
 * const result = err('not found');
 * const mapped = mapErr(result, e => ({ code: 404, message: e }));
 * // mapped = { _tag: 'Err', error: { code: 404, message: 'not found' } }
 *
 * const okResult = ok(42);
 * const unchanged = mapErr(okResult, e => ({ code: 500, message: e }));
 * // unchanged = { _tag: 'Ok', value: 42 } （変換されない）
 * ```
 */
export function mapErr<T, E, F>(
	result: Result<T, E>,
	fn: (error: E) => F,
): Result<T, F> {
	if (isErr(result)) {
		return err(fn(result.error));
	}
	return result;
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * 成功時の値を取り出す（失敗時は例外をスロー）
 *
 * **注意**: この関数は失敗時に例外をスローします。
 * 安全に値を取り出したい場合は unwrapOr または match を使用してください。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @param result - 対象のResult
 * @returns 成功時の値
 * @throws Resultが失敗の場合、エラー値を含むErrorをスロー
 *
 * @example
 * ```typescript
 * const okResult = ok(42);
 * console.log(unwrap(okResult)); // 42
 *
 * const errResult = err('エラー');
 * unwrap(errResult); // Error: Result is Err: エラー をスロー
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>): T {
	if (isOk(result)) {
		return result.value;
	}
	throw new Error(`Result is Err: ${String(result.error)}`);
}

/**
 * 成功時の値を取り出す（失敗時はデフォルト値を返す）
 *
 * 例外をスローせずに安全に値を取り出せます。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @param result - 対象のResult
 * @param defaultValue - 失敗時に返すデフォルト値
 * @returns 成功時の値またはデフォルト値
 *
 * @example
 * ```typescript
 * const okResult = ok(42);
 * console.log(unwrapOr(okResult, 0)); // 42
 *
 * const errResult = err('エラー');
 * console.log(unwrapOr(errResult, 0)); // 0
 * ```
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
	if (isOk(result)) {
		return result.value;
	}
	return defaultValue;
}

/**
 * パターンマッチング用インターフェース
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @typeParam R - 戻り値の型
 */
export interface MatchPattern<T, E, R> {
	/** 成功時のハンドラ */
	readonly ok: (value: T) => R;
	/** 失敗時のハンドラ */
	readonly err: (error: E) => R;
}

/**
 * Result のパターンマッチング
 *
 * 成功・失敗の両方のケースを処理し、統一された型の値を返します。
 * すべてのケースを網羅的に処理することが保証されます。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @typeParam R - 戻り値の型
 * @param result - 対象のResult
 * @param pattern - 成功・失敗時のハンドラを含むオブジェクト
 * @returns ハンドラの戻り値
 *
 * @example
 * ```typescript
 * const result: Result<number, string> = ok(42);
 *
 * const message = match(result, {
 *   ok: value => `計算結果: ${value}`,
 *   err: error => `エラー: ${error}`,
 * });
 * // message = '計算結果: 42'
 * ```
 */
export function match<T, E, R>(
	result: Result<T, E>,
	pattern: MatchPattern<T, E, R>,
): R {
	if (isOk(result)) {
		return pattern.ok(result.value);
	}
	return pattern.err(result.error);
}

// ============================================================
// 合成関数
// ============================================================

/**
 * 複数のResultをすべて成功した場合のみ成功を返す
 *
 * すべてのResultが成功の場合、値の配列を含むOkを返します。
 * いずれかが失敗の場合、最初の失敗を返します。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @param results - Resultの配列
 * @returns すべての値を含むResult、または最初のエラー
 *
 * @example
 * ```typescript
 * const results = [ok(1), ok(2), ok(3)];
 * const combined = all(results);
 * // combined = { _tag: 'Ok', value: [1, 2, 3] }
 *
 * const withError = [ok(1), err('失敗'), ok(3)];
 * const failed = all(withError);
 * // failed = { _tag: 'Err', error: '失敗' }
 * ```
 */
export function all<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
	const values: T[] = [];

	for (const result of results) {
		if (isErr(result)) {
			return result;
		}
		values.push(result.value);
	}

	return ok(values);
}

/**
 * タプル型用の all 関数（型を保持）
 *
 * 固定長のResultタプルを受け取り、値の型を保持したまま結合します。
 *
 * @typeParam Results - Resultのタプル型
 * @param results - Resultのタプル
 * @returns 値のタプルを含むResult、または最初のエラー
 *
 * @example
 * ```typescript
 * const result = allTuple([ok(1), ok('hello'), ok(true)] as const);
 * // result: Result<[number, string, boolean], never>
 * ```
 */
export function allTuple<
	Results extends readonly Result<unknown, unknown>[],
	E = Results[number] extends Result<unknown, infer Err> ? Err : never,
>(
	results: Results,
): Result<
	{
		[K in keyof Results]: Results[K] extends Result<infer T, unknown>
			? T
			: never;
	},
	E
> {
	const values: unknown[] = [];

	for (const result of results) {
		if (isErr(result)) {
			return result as Err<E>;
		}
		values.push((result as Ok<unknown>).value);
	}

	return ok(values) as Result<
		{
			[K in keyof Results]: Results[K] extends Result<infer T, unknown>
				? T
				: never;
		},
		E
	>;
}

/**
 * Promise を Result に変換
 *
 * Promiseが解決した場合はOkを、拒否された場合はErrを返します。
 * 非同期処理のエラーを型安全に扱えます。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型（デフォルトはunknown）
 * @param promise - 変換対象のPromise
 * @param errorMapper - 例外をエラー型に変換する関数（省略時はそのまま返す）
 * @returns Resultを含むPromise
 *
 * @example
 * ```typescript
 * // 基本的な使い方
 * const result = await fromPromise(fetch('/api/data'));
 * // result: Result<Response, unknown>
 *
 * // エラーマッパーを使用
 * const result = await fromPromise(
 *   fetch('/api/data'),
 *   (e) => ({ type: 'network', message: String(e) })
 * );
 * // result: Result<Response, { type: string; message: string }>
 * ```
 */
export async function fromPromise<T, E = unknown>(
	promise: Promise<T>,
	errorMapper?: (error: unknown) => E,
): Promise<Result<T, E>> {
	try {
		const value = await promise;
		return ok(value);
	} catch (error) {
		if (errorMapper) {
			return err(errorMapper(error));
		}
		return err(error as E);
	}
}

/**
 * 値が null または undefined の場合に Err を返す
 *
 * @typeParam T - 値の型
 * @typeParam E - エラーの型
 * @param value - チェック対象の値
 * @param error - null/undefined時のエラー
 * @returns 値がある場合はOk、ない場合はErr
 *
 * @example
 * ```typescript
 * const value: string | null = getUserName();
 * const result = fromNullable(value, 'ユーザー名が見つかりません');
 * // result: Result<string, string>
 * ```
 */
export function fromNullable<T, E>(
	value: T | null | undefined,
	error: E,
): Result<T, E> {
	if (value === null || value === undefined) {
		return err(error);
	}
	return ok(value);
}

/**
 * 例外をスローする可能性のある関数を Result に変換
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @param fn - 実行する関数
 * @param errorMapper - 例外をエラー型に変換する関数
 * @returns Result
 *
 * @example
 * ```typescript
 * const result = tryCatch(
 *   () => JSON.parse(jsonString),
 *   (e) => `JSONパースエラー: ${String(e)}`
 * );
 * // result: Result<unknown, string>
 * ```
 */
export function tryCatch<T, E>(
	fn: () => T,
	errorMapper: (error: unknown) => E,
): Result<T, E> {
	try {
		return ok(fn());
	} catch (error) {
		return err(errorMapper(error));
	}
}

// ============================================================
// メソッドチェーン用ラッパー（オプショナル）
// ============================================================

/**
 * メソッドチェーン可能なResultラッパークラス
 *
 * 関数型スタイルとOOPスタイルの両方をサポートします。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 *
 * @example
 * ```typescript
 * const result = ResultBox.ok(5)
 *   .map(x => x * 2)
 *   .flatMap(x => x > 8 ? ResultBox.err('too large') : ResultBox.ok(x))
 *   .unwrapOr(0);
 * // result = 10
 * ```
 */
export class ResultBox<T, E> {
	private constructor(private readonly result: Result<T, E>) {}

	/**
	 * 成功を含むResultBoxを生成
	 */
	static ok<T>(value: T): ResultBox<T, never> {
		return new ResultBox(ok(value));
	}

	/**
	 * 失敗を含むResultBoxを生成
	 */
	static err<E>(error: E): ResultBox<never, E> {
		return new ResultBox(err(error));
	}

	/**
	 * Resultから ResultBox を生成
	 */
	static from<T, E>(result: Result<T, E>): ResultBox<T, E> {
		return new ResultBox(result);
	}

	/**
	 * 内部の Result を取得
	 */
	toResult(): Result<T, E> {
		return this.result;
	}

	/**
	 * 成功かどうかを判定
	 */
	isOk(): boolean {
		return isOk(this.result);
	}

	/**
	 * 失敗かどうかを判定
	 */
	isErr(): boolean {
		return isErr(this.result);
	}

	/**
	 * 成功時の値を変換
	 */
	map<U>(fn: (value: T) => U): ResultBox<U, E> {
		return new ResultBox(map(this.result, fn));
	}

	/**
	 * 成功時の値を変換し、ネストを平坦化
	 */
	flatMap<U>(fn: (value: T) => Result<U, E>): ResultBox<U, E> {
		return new ResultBox(flatMap(this.result, fn));
	}

	/**
	 * 失敗時のエラーを変換
	 */
	mapErr<F>(fn: (error: E) => F): ResultBox<T, F> {
		return new ResultBox(mapErr(this.result, fn));
	}

	/**
	 * 成功時の値を取り出す（失敗時は例外）
	 */
	unwrap(): T {
		return unwrap(this.result);
	}

	/**
	 * 成功時の値を取り出す（失敗時はデフォルト値）
	 */
	unwrapOr(defaultValue: T): T {
		return unwrapOr(this.result, defaultValue);
	}

	/**
	 * パターンマッチング
	 */
	match<R>(pattern: MatchPattern<T, E, R>): R {
		return match(this.result, pattern);
	}
}
