/**
 * Option型モジュール
 *
 * 関数型プログラミングのOption/Maybe型パターンを実装。
 * 値の存在（Some）と不在（None）を型で明示的に表現し、
 * null/undefinedを安全に扱うことで型安全なコードを実現します。
 *
 * @module lib/domain/shared/option
 * @example
 * ```typescript
 * // 基本的な使い方
 * const option = some(42);
 * if (isSome(option)) {
 *   console.log(option.value); // 42
 * }
 *
 * // null/undefinedの変換
 * const maybeValue: string | null = getUserName();
 * const option = fromNullable(maybeValue);
 *
 * // チェーン処理
 * const doubled = option
 *   .pipe(map(x => x * 2))
 *   .pipe(filter(x => x > 50));
 *
 * // パターンマッチング
 * const message = match(option, {
 *   some: value => `値: ${value}`,
 *   none: () => '値がありません',
 * });
 * ```
 */

import { err, isOk, ok, type Result } from "./result";

// ============================================================
// 型定義
// ============================================================

/**
 * 値が存在することを表す型
 *
 * @typeParam T - 値の型
 */
export interface Some<T> {
	/** 型識別用タグ（discriminated union用） */
	readonly _tag: "Some";
	/** 保持している値 */
	readonly value: T;
}

/**
 * 値が存在しないことを表す型
 */
export interface None {
	/** 型識別用タグ（discriminated union用） */
	readonly _tag: "None";
}

/**
 * 値の存在または不在を表すオプション型
 *
 * @typeParam T - 値の型
 *
 * @example
 * ```typescript
 * function findUser(id: string): Option<User> {
 *   const user = users.get(id);
 *   return user ? some(user) : none();
 * }
 * ```
 */
export type Option<T> = Some<T> | None;

// ============================================================
// コンストラクタ
// ============================================================

/**
 * 値を持つOptionを生成
 *
 * @typeParam T - 値の型
 * @param value - 保持する値
 * @returns Some型のOption
 *
 * @example
 * ```typescript
 * const option = some(42);
 * // option: Some<number> = { _tag: 'Some', value: 42 }
 * ```
 */
export function some<T>(value: T): Some<T> {
	return { _tag: "Some", value } as const;
}

/**
 * 値を持たないOptionを生成
 *
 * @returns None型のOption
 *
 * @example
 * ```typescript
 * const option = none();
 * // option: None = { _tag: 'None' }
 * ```
 */
export function none(): None {
	return { _tag: "None" } as const;
}

/**
 * null または undefined を Option に変換
 *
 * 値が存在する場合はSomeを、null/undefinedの場合はNoneを返します。
 *
 * @typeParam T - 値の型
 * @param value - チェック対象の値
 * @returns 値が存在する場合はSome、存在しない場合はNone
 *
 * @example
 * ```typescript
 * const value: string | null = getUserName();
 * const option = fromNullable(value);
 * // value が null の場合: { _tag: 'None' }
 * // value が 'John' の場合: { _tag: 'Some', value: 'John' }
 * ```
 */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
	if (value === null || value === undefined) {
		return none();
	}
	return some(value);
}

// ============================================================
// 型ガード
// ============================================================

/**
 * Option が Some かどうかを判定
 *
 * 型ガードとして機能し、trueの場合はOptionがSome<T>に絞り込まれます。
 *
 * @typeParam T - 値の型
 * @param option - 判定対象のOption
 * @returns 値が存在する場合はtrue
 *
 * @example
 * ```typescript
 * const option: Option<number> = some(42);
 * if (isSome(option)) {
 *   // option は Some<number> 型に絞り込まれる
 *   console.log(option.value); // 42
 * }
 * ```
 */
export function isSome<T>(option: Option<T>): option is Some<T> {
	return option._tag === "Some";
}

/**
 * Option が None かどうかを判定
 *
 * 型ガードとして機能し、trueの場合はOptionがNoneに絞り込まれます。
 *
 * @typeParam T - 値の型
 * @param option - 判定対象のOption
 * @returns 値が存在しない場合はtrue
 *
 * @example
 * ```typescript
 * const option: Option<number> = none();
 * if (isNone(option)) {
 *   // option は None 型に絞り込まれる
 *   console.log('値がありません');
 * }
 * ```
 */
export function isNone<T>(option: Option<T>): option is None {
	return option._tag === "None";
}

// ============================================================
// 変換関数
// ============================================================

/**
 * Some の値を変換
 *
 * OptionがSomeの場合、値に関数を適用した新しいSomeを返します。
 * Noneの場合はそのまま返します。
 *
 * @typeParam T - 元の値の型
 * @typeParam U - 変換後の値の型
 * @param option - 対象のOption
 * @param fn - 変換関数
 * @returns 変換後のOption
 *
 * @example
 * ```typescript
 * const option = some(5);
 * const doubled = map(option, x => x * 2);
 * // doubled = { _tag: 'Some', value: 10 }
 *
 * const noneOption = none();
 * const mapped = map(noneOption, x => x * 2);
 * // mapped = { _tag: 'None' } （変換されない）
 * ```
 */
export function map<T, U>(option: Option<T>, fn: (value: T) => U): Option<U> {
	if (isSome(option)) {
		return some(fn(option.value));
	}
	return option;
}

/**
 * Some の値を変換し、ネストしたOptionを平坦化
 *
 * OptionがSomeの場合、値に関数を適用して得られたOptionを返します。
 * Noneの場合はそのまま返します。
 * mapと異なり、変換関数がOptionを返す場合にネストを防ぎます。
 *
 * @typeParam T - 元の値の型
 * @typeParam U - 変換後の値の型
 * @param option - 対象のOption
 * @param fn - Optionを返す変換関数
 * @returns 変換後のOption（平坦化済み）
 *
 * @example
 * ```typescript
 * function parseNumber(s: string): Option<number> {
 *   const n = parseInt(s, 10);
 *   return isNaN(n) ? none() : some(n);
 * }
 *
 * const option = some('42');
 * const parsed = flatMap(option, parseNumber);
 * // parsed = { _tag: 'Some', value: 42 }
 *
 * const invalid = some('abc');
 * const failed = flatMap(invalid, parseNumber);
 * // failed = { _tag: 'None' }
 * ```
 */
export function flatMap<T, U>(
	option: Option<T>,
	fn: (value: T) => Option<U>,
): Option<U> {
	if (isSome(option)) {
		return fn(option.value);
	}
	return option;
}

/**
 * 条件を満たす値のみを保持
 *
 * OptionがSomeで、値が条件を満たす場合はそのままSomeを返します。
 * 条件を満たさない場合、またはNoneの場合はNoneを返します。
 *
 * @typeParam T - 値の型
 * @param option - 対象のOption
 * @param predicate - フィルタ条件
 * @returns 条件を満たす場合はSome、そうでない場合はNone
 *
 * @example
 * ```typescript
 * const option = some(10);
 * const filtered = filter(option, x => x > 5);
 * // filtered = { _tag: 'Some', value: 10 }
 *
 * const small = some(3);
 * const filteredSmall = filter(small, x => x > 5);
 * // filteredSmall = { _tag: 'None' }
 * ```
 */
export function filter<T>(
	option: Option<T>,
	predicate: (value: T) => boolean,
): Option<T> {
	if (isSome(option) && predicate(option.value)) {
		return option;
	}
	return none();
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * Some の値を取り出す（Noneの場合は例外をスロー）
 *
 * **注意**: この関数はNoneの場合に例外をスローします。
 * 安全に値を取り出したい場合は unwrapOr または match を使用してください。
 *
 * @typeParam T - 値の型
 * @param option - 対象のOption
 * @returns Someの値
 * @throws OptionがNoneの場合、Errorをスロー
 *
 * @example
 * ```typescript
 * const someOption = some(42);
 * console.log(unwrap(someOption)); // 42
 *
 * const noneOption = none();
 * unwrap(noneOption); // Error: Option is None をスロー
 * ```
 */
export function unwrap<T>(option: Option<T>): T {
	if (isSome(option)) {
		return option.value;
	}
	throw new Error("Option is None");
}

/**
 * Some の値を取り出す（Noneの場合はデフォルト値を返す）
 *
 * 例外をスローせずに安全に値を取り出せます。
 *
 * @typeParam T - 値の型
 * @param option - 対象のOption
 * @param defaultValue - Noneの場合に返すデフォルト値
 * @returns Someの値またはデフォルト値
 *
 * @example
 * ```typescript
 * const someOption = some(42);
 * console.log(unwrapOr(someOption, 0)); // 42
 *
 * const noneOption = none();
 * console.log(unwrapOr(noneOption, 0)); // 0
 * ```
 */
export function unwrapOr<T>(option: Option<T>, defaultValue: T): T {
	if (isSome(option)) {
		return option.value;
	}
	return defaultValue;
}

/**
 * パターンマッチング用インターフェース
 *
 * @typeParam T - 値の型
 * @typeParam R - 戻り値の型
 */
export interface OptionMatchPattern<T, R> {
	/** 値が存在する場合のハンドラ */
	readonly some: (value: T) => R;
	/** 値が存在しない場合のハンドラ */
	readonly none: () => R;
}

/**
 * Option のパターンマッチング
 *
 * Some・Noneの両方のケースを処理し、統一された型の値を返します。
 * すべてのケースを網羅的に処理することが保証されます。
 *
 * @typeParam T - 値の型
 * @typeParam R - 戻り値の型
 * @param option - 対象のOption
 * @param pattern - Some・Noneのハンドラを含むオブジェクト
 * @returns ハンドラの戻り値
 *
 * @example
 * ```typescript
 * const option: Option<number> = some(42);
 *
 * const message = match(option, {
 *   some: value => `値は ${value} です`,
 *   none: () => '値がありません',
 * });
 * // message = '値は 42 です'
 * ```
 */
export function match<T, R>(
	option: Option<T>,
	pattern: OptionMatchPattern<T, R>,
): R {
	if (isSome(option)) {
		return pattern.some(option.value);
	}
	return pattern.none();
}

// ============================================================
// Result との相互変換
// ============================================================

/**
 * Option を Result に変換
 *
 * Someの場合はOkを、Noneの場合は指定したエラーを含むErrを返します。
 *
 * @typeParam T - 値の型
 * @typeParam E - エラーの型
 * @param option - 変換対象のOption
 * @param error - Noneの場合に使用するエラー値
 * @returns Result型
 *
 * @example
 * ```typescript
 * const someOption = some(42);
 * const result = toResult(someOption, '値がありません');
 * // result = { _tag: 'Ok', value: 42 }
 *
 * const noneOption = none();
 * const errResult = toResult(noneOption, '値がありません');
 * // errResult = { _tag: 'Err', error: '値がありません' }
 * ```
 */
export function toResult<T, E>(option: Option<T>, error: E): Result<T, E> {
	if (isSome(option)) {
		return ok(option.value);
	}
	return err(error);
}

/**
 * Result を Option に変換
 *
 * Okの場合はSomeを、Errの場合はNoneを返します。
 * エラー情報は破棄されます。
 *
 * @typeParam T - 成功時の値の型
 * @typeParam E - エラーの型
 * @param result - 変換対象のResult
 * @returns Option型
 *
 * @example
 * ```typescript
 * const okResult: Result<number, string> = ok(42);
 * const option = fromResult(okResult);
 * // option = { _tag: 'Some', value: 42 }
 *
 * const errResult: Result<number, string> = err('エラー');
 * const noneOption = fromResult(errResult);
 * // noneOption = { _tag: 'None' }
 * ```
 */
export function fromResult<T, E>(result: Result<T, E>): Option<T> {
	if (isOk(result)) {
		return some(result.value);
	}
	return none();
}

// ============================================================
// 合成関数
// ============================================================

/**
 * 複数のOptionをすべてSomeの場合のみSomeを返す
 *
 * すべてのOptionがSomeの場合、値の配列を含むSomeを返します。
 * いずれかがNoneの場合、Noneを返します。
 *
 * @typeParam T - 値の型
 * @param options - Optionの配列
 * @returns すべての値を含むOption、またはNone
 *
 * @example
 * ```typescript
 * const options = [some(1), some(2), some(3)];
 * const combined = all(options);
 * // combined = { _tag: 'Some', value: [1, 2, 3] }
 *
 * const withNone = [some(1), none(), some(3)];
 * const failed = all(withNone);
 * // failed = { _tag: 'None' }
 * ```
 */
export function all<T>(options: readonly Option<T>[]): Option<T[]> {
	const values: T[] = [];

	for (const option of options) {
		if (isNone(option)) {
			return option;
		}
		values.push(option.value);
	}

	return some(values);
}

/**
 * タプル型用の all 関数（型を保持）
 *
 * 固定長のOptionタプルを受け取り、値の型を保持したまま結合します。
 *
 * @typeParam Options - Optionのタプル型
 * @param options - Optionのタプル
 * @returns 値のタプルを含むOption、またはNone
 *
 * @example
 * ```typescript
 * const result = allTuple([some(1), some('hello'), some(true)] as const);
 * // result: Option<[number, string, boolean]>
 * ```
 */
export function allTuple<Options extends readonly Option<unknown>[]>(
	options: Options,
): Option<{
	[K in keyof Options]: Options[K] extends Option<infer T> ? T : never;
}> {
	const values: unknown[] = [];

	for (const option of options) {
		if (isNone(option)) {
			return option as None;
		}
		values.push((option as Some<unknown>).value);
	}

	return some(values) as Option<{
		[K in keyof Options]: Options[K] extends Option<infer T> ? T : never;
	}>;
}

/**
 * 最初のSomeを返す
 *
 * 配列の先頭からOptionを評価し、最初に見つかったSomeを返します。
 * すべてNoneの場合はNoneを返します。
 *
 * @typeParam T - 値の型
 * @param options - Optionの配列
 * @returns 最初のSome、またはNone
 *
 * @example
 * ```typescript
 * const options = [none(), some(2), some(3)];
 * const first = firstSome(options);
 * // first = { _tag: 'Some', value: 2 }
 *
 * const allNone = [none(), none()];
 * const noFirst = firstSome(allNone);
 * // noFirst = { _tag: 'None' }
 * ```
 */
export function firstSome<T>(options: readonly Option<T>[]): Option<T> {
	for (const option of options) {
		if (isSome(option)) {
			return option;
		}
	}
	return none();
}

// ============================================================
// メソッドチェーン用ラッパー
// ============================================================

/**
 * メソッドチェーン可能なOptionラッパークラス
 *
 * 関数型スタイルとOOPスタイルの両方をサポートします。
 *
 * @typeParam T - 値の型
 *
 * @example
 * ```typescript
 * const result = OptionBox.some(5)
 *   .map(x => x * 2)
 *   .filter(x => x > 8)
 *   .flatMap(x => x > 10 ? OptionBox.none() : OptionBox.some(x))
 *   .unwrapOr(0);
 * // result = 10
 * ```
 */
export class OptionBox<T> {
	private constructor(private readonly option: Option<T>) {}

	/**
	 * 値を含むOptionBoxを生成
	 */
	static some<T>(value: T): OptionBox<T> {
		return new OptionBox(some(value));
	}

	/**
	 * 空のOptionBoxを生成
	 */
	static none<T = never>(): OptionBox<T> {
		return new OptionBox(none());
	}

	/**
	 * Optionから OptionBox を生成
	 */
	static from<T>(option: Option<T>): OptionBox<T> {
		return new OptionBox(option);
	}

	/**
	 * null/undefinedから OptionBox を生成
	 */
	static fromNullable<T>(value: T | null | undefined): OptionBox<T> {
		return new OptionBox(fromNullable(value));
	}

	/**
	 * 内部の Option を取得
	 */
	toOption(): Option<T> {
		return this.option;
	}

	/**
	 * 値が存在するかどうかを判定
	 */
	isSome(): boolean {
		return isSome(this.option);
	}

	/**
	 * 値が存在しないかどうかを判定
	 */
	isNone(): boolean {
		return isNone(this.option);
	}

	/**
	 * 値を変換
	 */
	map<U>(fn: (value: T) => U): OptionBox<U> {
		return new OptionBox(map(this.option, fn));
	}

	/**
	 * 値を変換し、ネストを平坦化
	 */
	flatMap<U>(fn: (value: T) => Option<U>): OptionBox<U> {
		return new OptionBox(flatMap(this.option, fn));
	}

	/**
	 * 条件を満たす値のみを保持
	 */
	filter(predicate: (value: T) => boolean): OptionBox<T> {
		return new OptionBox(filter(this.option, predicate));
	}

	/**
	 * 値を取り出す（Noneの場合は例外）
	 */
	unwrap(): T {
		return unwrap(this.option);
	}

	/**
	 * 値を取り出す（Noneの場合はデフォルト値）
	 */
	unwrapOr(defaultValue: T): T {
		return unwrapOr(this.option, defaultValue);
	}

	/**
	 * パターンマッチング
	 */
	match<R>(pattern: OptionMatchPattern<T, R>): R {
		return match(this.option, pattern);
	}

	/**
	 * Result に変換
	 */
	toResult<E>(error: E): Result<T, E> {
		return toResult(this.option, error);
	}
}
