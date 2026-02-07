/**
 * better-sqlite3 型宣言
 *
 * better-sqlite3パッケージの最小限の型定義です。
 * プロジェクトで使用されるAPIのみ定義しています。
 */
declare module "better-sqlite3" {
	interface Statement {
		run(...params: unknown[]): unknown;
		get(...params: unknown[]): unknown;
		all(...params: unknown[]): unknown[];
	}

	type Transaction<F extends (...args: unknown[]) => unknown> = (
		...args: Parameters<F>
	) => ReturnType<F>;

	interface Database {
		prepare(sql: string): Statement;
		exec(sql: string): this;
		transaction<F extends (...args: unknown[]) => unknown>(
			fn: F,
		): Transaction<F>;
		close(): void;
	}

	function DatabaseConstructor(
		filename: string,
		options?: Record<string, unknown>,
	): Database;

	namespace DatabaseConstructor {
		type Database = import("better-sqlite3").Database;
	}

	export = DatabaseConstructor;
}
