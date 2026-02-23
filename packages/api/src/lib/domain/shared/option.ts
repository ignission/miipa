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
