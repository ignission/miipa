import { useCallback, useState } from "react";
import type {
	SaveSetupSettingsRequest,
	SetupStatusResponse,
	ValidateKeyRequest,
} from "../api/setup";
import {
	fetchSetupStatus,
	saveSetupSettings,
	validateApiKey,
} from "../api/setup";
import type { SetupStep } from "../components/setup/types";

/** useSetup フックの戻り値型 */
export interface UseSetupReturn {
	/** 現在のステップ */
	step: SetupStep;
	/** ステップを変更する */
	setStep: (step: SetupStep) => void;
	/** セットアップ状態 */
	status: SetupStatusResponse | null;
	/** セットアップ状態を読み込む */
	loadStatus: () => Promise<void>;
	/** 状態読み込み中 */
	isLoadingStatus: boolean;
	/** 設定を保存する */
	saveSettings: (data: SaveSetupSettingsRequest) => Promise<boolean>;
	/** 設定保存中 */
	isSaving: boolean;
	/** APIキーを検証する */
	validateKey: (data: ValidateKeyRequest) => Promise<boolean>;
	/** キー検証中 */
	isValidating: boolean;
	/** エラーメッセージ */
	error: string | null;
	/** エラーをクリアする */
	clearError: () => void;
}

/**
 * セットアップフック
 *
 * セットアップフローの状態管理を提供します。
 * Web の SetupClientWrapper コンポーネントから状態管理ロジックを抽出したフックです。
 *
 * - セットアップ状態チェック
 * - 設定保存（LLMプロバイダ・APIキー）
 * - APIキー検証
 */
export function useSetup(): UseSetupReturn {
	const [step, setStep] = useState<SetupStep>("calendar");
	const [status, setStatus] = useState<SetupStatusResponse | null>(null);
	const [isLoadingStatus, setIsLoadingStatus] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/** エラーをクリア */
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	/**
	 * セットアップ状態を読み込む
	 */
	const loadStatus = useCallback(async () => {
		setIsLoadingStatus(true);
		setError(null);

		try {
			const data = await fetchSetupStatus();
			if (!data) {
				setError("セットアップ状態の取得に失敗しました");
				return;
			}
			setStatus(data);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "セットアップ状態の取得に失敗しました";
			setError(message);
		} finally {
			setIsLoadingStatus(false);
		}
	}, []);

	/**
	 * 設定を保存する
	 *
	 * 既存キーの上書き確認が必要な場合は自動的にリトライします。
	 *
	 * @param data - 保存する設定データ
	 * @returns 保存成功ならtrue
	 */
	const saveSettings = useCallback(
		async (data: SaveSetupSettingsRequest): Promise<boolean> => {
			setIsSaving(true);
			setError(null);

			try {
				const result = await saveSetupSettings(data);

				if (!result) {
					setError("設定の保存に失敗しました");
					return false;
				}

				if (result.success) {
					return true;
				}

				// 既存キーが存在し上書き確認が必要な場合
				if (result.requiresConfirmation) {
					const retryResult = await saveSetupSettings({
						...data,
						overwriteExisting: true,
					});
					if (!retryResult) {
						setError("設定の保存に失敗しました");
						return false;
					}
					if (retryResult.success) {
						return true;
					}
					setError(retryResult.error?.message ?? "設定の保存に失敗しました");
					return false;
				}

				setError(result.error?.message ?? "設定の保存に失敗しました");
				return false;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "ネットワークエラーが発生しました";
				setError(message);
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[],
	);

	/**
	 * APIキーを検証する
	 *
	 * @param data - 検証するキー情報
	 * @returns 検証成功ならtrue
	 */
	const validateKeyFn = useCallback(
		async (data: ValidateKeyRequest): Promise<boolean> => {
			setIsValidating(true);
			setError(null);

			try {
				const result = await validateApiKey(data);

				if (!result) {
					setError("APIキーの検証に失敗しました");
					return false;
				}

				if (result.valid) {
					return true;
				}

				setError(result.error?.message ?? "APIキーの検証に失敗しました");
				return false;
			} catch (err) {
				const message =
					err instanceof Error
						? err.message
						: "ネットワークエラーが発生しました";
				setError(message);
				return false;
			} finally {
				setIsValidating(false);
			}
		},
		[],
	);

	return {
		step,
		setStep,
		status,
		loadStatus,
		isLoadingStatus,
		saveSettings,
		isSaving,
		validateKey: validateKeyFn,
		isValidating,
		error,
		clearError,
	};
}
