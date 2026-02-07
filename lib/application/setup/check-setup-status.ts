/**
 * セットアップ状態確認ユースケースモジュール
 *
 * SoloDayアプリケーションのセットアップ状態を確認する機能を提供します。
 * CalendarContextを通じて設定リポジトリとシークレットリポジトリにアクセスし、
 * プロバイダ設定の取得、APIキーの有無確認を行います。
 *
 * すべての操作はResult型を返し、例外をスローしません。
 *
 * @module lib/application/setup/check-setup-status
 *
 * @example
 * ```typescript
 * import { checkSetupStatus, isFirstLaunch } from '@/lib/application/setup/check-setup-status';
 * import { isOk, match } from '@/lib/domain/shared';
 * import { createCalendarContext } from '@/lib/context/calendar-context';
 *
 * const ctx = createCalendarContext(db, userId, encryptionKey);
 *
 * // セットアップ状態の確認
 * const statusResult = await checkSetupStatus(ctx);
 *
 * match(statusResult, {
 *   ok: (status) => {
 *     if (status.isComplete) {
 *       console.log('セットアップ完了済み:', status.currentProvider);
 *     } else {
 *       console.log('セットアップが必要です');
 *     }
 *   },
 *   err: (error) => console.error('状態確認に失敗:', error.message),
 * });
 *
 * // 初回起動判定
 * const firstLaunchResult = await isFirstLaunch(ctx);
 * if (isOk(firstLaunchResult) && firstLaunchResult.value) {
 *   console.log('初回起動です');
 * }
 * ```
 */

import type { LLMProvider } from "@/lib/config/types";
import { isLLMProvider } from "@/lib/config/types";
import type { CalendarContext } from "@/lib/context/calendar-context";
import type { ConfigError } from "@/lib/domain/shared";
import { isErr, ok, type Result } from "@/lib/domain/shared";
import type { SecretError } from "@/lib/infrastructure/secret";

import {
	createSetupStatus,
	getSecretKeyForProvider,
	type SetupStatus,
} from "./types";

// ============================================================
// 型定義
// ============================================================

/**
 * セットアップ状態確認時に発生しうるエラー型
 *
 * ConfigError: 設定の読み込みエラー
 * SecretError: シークレットストレージアクセスエラー
 */
export type SetupStatusError = ConfigError | SecretError;

// ============================================================
// メイン関数
// ============================================================

/**
 * セットアップ状態を確認する
 *
 * 以下の順序でセットアップ状態を確認します:
 * 1. D1のuser_settingsからllm_provider設定の有無を確認
 * 2. プロバイダが設定されている場合、対応するAPIキーの存在を確認
 * 3. カレンダー設定数を確認
 *
 * @param ctx - CalendarContext（依存性注入コンテナ）
 * @returns セットアップ状態を含むResult
 *
 * @example
 * ```typescript
 * const result = await checkSetupStatus(ctx);
 *
 * match(result, {
 *   ok: (status) => {
 *     console.log('セットアップ完了:', status.isComplete);
 *     console.log('プロバイダ:', status.currentProvider);
 *     console.log('APIキー有無:', status.hasApiKey);
 *   },
 *   err: (error) => {
 *     console.error(`エラー [${error.code}]: ${error.message}`);
 *   },
 * });
 * ```
 */
export async function checkSetupStatus(
	ctx: CalendarContext,
): Promise<Result<SetupStatus, SetupStatusError>> {
	// 1. プロバイダ設定の取得
	const providerResult = await ctx.configRepository.getSetting("llm_provider");
	if (isErr(providerResult)) {
		return providerResult;
	}

	// プロバイダ設定が存在しない場合は初期状態を返す
	const providerValue = providerResult.value;
	if (providerValue === null || !isLLMProvider(providerValue)) {
		return ok(
			createSetupStatus({
				currentProvider: undefined,
				hasApiKey: false,
				calendarCount: 0,
			}),
		);
	}

	const currentProvider: LLMProvider = providerValue;

	// 2. プロバイダに対応するAPIキーの存在確認
	const secretKey = getSecretKeyForProvider(currentProvider);
	const hasSecretResult = await ctx.secretRepository.hasSecret(secretKey);
	if (isErr(hasSecretResult)) {
		return hasSecretResult;
	}

	// 3. カレンダー数の取得
	const calendarsResult = await ctx.configRepository.getSetting("calendars");
	let calendarCount = 0;
	if (isErr(calendarsResult)) {
		return calendarsResult;
	}
	if (calendarsResult.value !== null) {
		try {
			calendarCount = (JSON.parse(calendarsResult.value) as unknown[]).length;
		} catch {
			// パース失敗時は0として扱う
			calendarCount = 0;
		}
	}

	// セットアップ状態を生成して返す
	return ok(
		createSetupStatus({
			currentProvider,
			hasApiKey: hasSecretResult.value,
			calendarCount,
		}),
	);
}

/**
 * 初回起動かどうかを判定する
 *
 * プロバイダ設定が存在しない場合を「初回起動」と判定します。
 * この関数はcheckSetupStatusよりも軽量で、プロバイダ設定の存在確認のみを行います。
 *
 * @param ctx - CalendarContext（依存性注入コンテナ）
 * @returns 初回起動の場合はOk(true)、そうでない場合はOk(false)
 *
 * @example
 * ```typescript
 * const result = await isFirstLaunch(ctx);
 *
 * if (isOk(result) && result.value) {
 *   // 初回起動時の処理（セットアップ画面へリダイレクトなど）
 *   redirectToSetup();
 * }
 * ```
 */
export async function isFirstLaunch(
	ctx: CalendarContext,
): Promise<Result<boolean, SetupStatusError>> {
	const providerResult = await ctx.configRepository.getSetting("llm_provider");

	if (isErr(providerResult)) {
		return providerResult;
	}

	// プロバイダ設定が存在しない = 初回起動
	return ok(providerResult.value === null);
}

/**
 * セットアップが完了しているかどうかを判定する
 *
 * checkSetupStatusの結果からisCompleteを取得する便利関数です。
 *
 * @param ctx - CalendarContext（依存性注入コンテナ）
 * @returns セットアップ完了の場合はOk(true)、そうでない場合はOk(false)
 *
 * @example
 * ```typescript
 * const result = await isSetupComplete(ctx);
 *
 * if (isOk(result) && result.value) {
 *   // セットアップ完了済み、メイン画面を表示
 *   showMainScreen();
 * } else {
 *   // セットアップ未完了、セットアップ画面へ
 *   redirectToSetup();
 * }
 * ```
 */
export async function isSetupComplete(
	ctx: CalendarContext,
): Promise<Result<boolean, SetupStatusError>> {
	const statusResult = await checkSetupStatus(ctx);

	if (isErr(statusResult)) {
		return statusResult;
	}

	return ok(statusResult.value.isComplete);
}
