/**
 * セットアップページ（Server Component）
 *
 * セットアップフローのエントリーポイントとなるServer Componentです。
 * サーバーサイドでセットアップ状態を取得し、Client Componentに渡します。
 *
 * @module app/setup/page
 *
 * @example
 * ブラウザで /setup にアクセスするとセットアップウィザードが表示されます。
 */

import { SetupClientWrapper } from "@/components/setup/SetupClientWrapper";
import { checkSetupStatus } from "@/lib/application/setup";
import { isOk } from "@/lib/domain/shared";

/**
 * セットアップページ
 *
 * サーバーサイドでセットアップ状態を確認し、Client Componentに渡します。
 * - isExistingSetup: 既にセットアップが完了している場合はtrue（設定変更モード）
 * - currentProvider: 現在設定されているプロバイダ
 *
 * @returns セットアップページ要素
 */
export default async function SetupPage() {
	// サーバーサイドでセットアップ状態を取得
	const statusResult = await checkSetupStatus();

	// セットアップ状態から初期値を決定
	const isExistingSetup = isOk(statusResult) && statusResult.value.isComplete;
	const currentProvider = isOk(statusResult)
		? statusResult.value.currentProvider
		: undefined;

	return (
		<SetupClientWrapper
			isExistingSetup={isExistingSetup}
			currentProvider={currentProvider}
		/>
	);
}
