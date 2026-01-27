/**
 * セットアップ状態確認ユースケースモジュール
 *
 * SoloDayアプリケーションのセットアップ状態を確認する機能を提供します。
 * 設定ファイルの存在確認、プロバイダ設定の取得、APIキーの有無確認を行います。
 *
 * すべての操作はResult型を返し、例外をスローしません。
 *
 * @module lib/application/setup/check-setup-status
 *
 * @example
 * ```typescript
 * import { checkSetupStatus, isFirstLaunch } from '@/lib/application/setup/check-setup-status';
 * import { isOk, match } from '@/lib/domain/shared';
 *
 * // セットアップ状態の確認
 * const statusResult = await checkSetupStatus();
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
 * const firstLaunchResult = await isFirstLaunch();
 * if (isOk(firstLaunchResult) && firstLaunchResult.value) {
 *   console.log('初回起動です');
 * }
 * ```
 */

import { configExists, loadConfig } from "@/lib/config/loader";
import type { ConfigError } from "@/lib/domain/shared";
import { isErr, ok, type Result } from "@/lib/domain/shared";
import { hasSecret, type SecretError } from "@/lib/infrastructure/secret";

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
 * ConfigError: 設定ファイルの読み込みエラー
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
 * 1. 設定ファイル（~/.soloday/config.json）の存在確認
 * 2. 設定ファイルが存在する場合、設定を読み込みプロバイダを取得
 * 3. プロバイダに対応するAPIキーがKeychainに存在するか確認
 *
 * @returns セットアップ状態を含むResult
 *
 * @example
 * ```typescript
 * const result = await checkSetupStatus();
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
export async function checkSetupStatus(): Promise<
	Result<SetupStatus, SetupStatusError>
> {
	// 1. 設定ファイルの存在確認
	const existsResult = await configExists();
	if (isErr(existsResult)) {
		return existsResult;
	}

	// 設定ファイルが存在しない場合は初期状態を返す
	if (!existsResult.value) {
		return ok(
			createSetupStatus({
				currentProvider: undefined,
				hasApiKey: false,
			}),
		);
	}

	// 2. 設定ファイルを読み込んでプロバイダを取得
	const configResult = await loadConfig();
	if (isErr(configResult)) {
		return configResult;
	}

	const config = configResult.value;
	const currentProvider = config.llm.provider;

	// 3. プロバイダに対応するAPIキーの存在確認
	const secretKey = getSecretKeyForProvider(currentProvider);
	const hasSecretResult = await hasSecret(secretKey);
	if (isErr(hasSecretResult)) {
		return hasSecretResult;
	}

	// セットアップ状態を生成して返す
	return ok(
		createSetupStatus({
			currentProvider,
			hasApiKey: hasSecretResult.value,
		}),
	);
}

/**
 * 初回起動かどうかを判定する
 *
 * 設定ファイルが存在しない場合を「初回起動」と判定します。
 * この関数はcheckSetupStatusよりも軽量で、設定ファイルの存在確認のみを行います。
 *
 * @returns 初回起動の場合はOk(true)、そうでない場合はOk(false)
 *
 * @example
 * ```typescript
 * const result = await isFirstLaunch();
 *
 * if (isOk(result) && result.value) {
 *   // 初回起動時の処理（セットアップ画面へリダイレクトなど）
 *   redirectToSetup();
 * }
 * ```
 */
export async function isFirstLaunch(): Promise<
	Result<boolean, SetupStatusError>
> {
	const existsResult = await configExists();

	if (isErr(existsResult)) {
		return existsResult;
	}

	// 設定ファイルが存在しない = 初回起動
	return ok(!existsResult.value);
}

/**
 * セットアップが完了しているかどうかを判定する
 *
 * checkSetupStatusの結果からisCompleteを取得する便利関数です。
 *
 * @returns セットアップ完了の場合はOk(true)、そうでない場合はOk(false)
 *
 * @example
 * ```typescript
 * const result = await isSetupComplete();
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
export async function isSetupComplete(): Promise<
	Result<boolean, SetupStatusError>
> {
	const statusResult = await checkSetupStatus();

	if (isErr(statusResult)) {
		return statusResult;
	}

	return ok(statusResult.value.isComplete);
}
