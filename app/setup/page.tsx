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

import { Suspense } from "react";
import { SetupClientWrapper } from "@/components/setup/SetupClientWrapper";
import { checkSetupStatus } from "@/lib/application/setup";
import { isOk } from "@/lib/domain/shared";
import { css } from "@/styled-system/css";

/**
 * ローディングフォールバック
 */
function SetupLoading() {
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				color: "fg.muted",
			})}
		>
			読み込み中...
		</div>
	);
}

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
		<Suspense fallback={<SetupLoading />}>
			<SetupClientWrapper
				isExistingSetup={isExistingSetup}
				currentProvider={currentProvider}
			/>
		</Suspense>
	);
}
