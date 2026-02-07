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
import { auth } from "@/auth";
import { SetupClientWrapper } from "@/components/setup/SetupClientWrapper";
import { checkSetupStatus } from "@/lib/application/setup";
import type { LLMProvider } from "@/lib/config/types";
import { createCalendarContext } from "@/lib/context/calendar-context";
import { isOk } from "@/lib/domain/shared";
import {
	getD1Database,
	getEncryptionKey,
} from "@/lib/infrastructure/cloudflare/bindings";
import { importEncryptionKey } from "@/lib/infrastructure/crypto/web-crypto-encryption";
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
	const session = await auth();

	// 認証済みかつD1接続可能な場合のみセットアップ状態を取得
	let isExistingSetup = false;
	let currentProvider: LLMProvider | undefined;

	if (session?.user?.id) {
		const dbResult = getD1Database();
		const keyResult = getEncryptionKey();

		if (isOk(dbResult) && isOk(keyResult)) {
			const cryptoKeyResult = await importEncryptionKey(keyResult.value);

			if (isOk(cryptoKeyResult)) {
				const ctx = createCalendarContext(
					dbResult.value,
					session.user.id,
					cryptoKeyResult.value,
				);
				const statusResult = await checkSetupStatus(ctx);

				isExistingSetup = isOk(statusResult) && statusResult.value.isComplete;
				currentProvider = isOk(statusResult)
					? statusResult.value.currentProvider
					: undefined;
			}
		}
	}

	return (
		<Suspense fallback={<SetupLoading />}>
			<SetupClientWrapper
				isExistingSetup={isExistingSetup}
				currentProvider={currentProvider}
			/>
		</Suspense>
	);
}
