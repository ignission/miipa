"use client";

/**
 * アカウント設定クライアントコンポーネント
 *
 * ユーザー情報の表示、サインアウト、アカウント削除UIを提供します。
 *
 * @module app/settings/account/AccountSettingsClient
 */

import { signOut } from "next-auth/react";
import { useState } from "react";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { css } from "@/styled-system/css";

/** AccountSettingsClientのProps */
interface AccountSettingsClientProps {
	/** ユーザー名 */
	userName: string;
	/** メールアドレス */
	userEmail: string;
}

/**
 * アカウント設定クライアント
 *
 * サインアウト・アカウント削除の操作UIを提供します。
 */
export function AccountSettingsClient({
	userName,
	userEmail,
}: AccountSettingsClientProps) {
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				gap: "6",
			})}
		>
			{/* ユーザー情報セクション */}
			<section
				className={css({
					display: "flex",
					flexDirection: "column",
					gap: "4",
				})}
			>
				<h2
					className={css({
						fontSize: "lg",
						fontWeight: "semibold",
						color: "fg.default",
					})}
				>
					ユーザー情報
				</h2>
				<div
					className={css({
						display: "flex",
						flexDirection: "column",
						gap: "3",
						p: "4",
						bg: "bg.subtle",
						borderRadius: "lg",
					})}
				>
					<div>
						<p
							className={css({
								fontSize: "sm",
								color: "fg.muted",
								mb: "1",
							})}
						>
							名前
						</p>
						<p
							className={css({
								fontSize: "md",
								fontWeight: "medium",
								color: "fg.default",
							})}
						>
							{userName || "未設定"}
						</p>
					</div>
					<div>
						<p
							className={css({
								fontSize: "sm",
								color: "fg.muted",
								mb: "1",
							})}
						>
							メールアドレス
						</p>
						<p
							className={css({
								fontSize: "md",
								fontWeight: "medium",
								color: "fg.default",
							})}
						>
							{userEmail || "未設定"}
						</p>
					</div>
				</div>
			</section>

			{/* サインアウトボタン */}
			<button
				type="button"
				onClick={() => signOut({ callbackUrl: "/auth/signin" })}
				className={css({
					px: "4",
					py: "2",
					bg: "transparent",
					color: "fg.default",
					border: "1px solid",
					borderColor: "border.default",
					borderRadius: "md",
					fontWeight: "medium",
					cursor: "pointer",
					transition: "all 0.15s ease",
					alignSelf: "flex-start",
					_hover: {
						bg: "bg.subtle",
					},
				})}
			>
				サインアウト
			</button>

			{/* 区切り線 */}
			<hr
				className={css({
					border: "none",
					borderTop: "1px solid",
					borderColor: "border.default",
				})}
			/>

			{/* 危険ゾーン */}
			<section
				className={css({
					border: "1px solid",
					borderColor: "red.300",
					borderRadius: "lg",
					p: "4",
					display: "flex",
					flexDirection: "column",
					gap: "3",
				})}
			>
				<h2
					className={css({
						fontSize: "lg",
						fontWeight: "semibold",
						color: "red.9",
					})}
				>
					危険な操作
				</h2>
				<p
					className={css({
						fontSize: "sm",
						color: "fg.muted",
					})}
				>
					アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
				</p>
				<button
					type="button"
					onClick={() => setIsDeleteDialogOpen(true)}
					className={css({
						px: "4",
						py: "2",
						bg: "red.9",
						color: "red.fg",
						borderRadius: "md",
						fontWeight: "medium",
						cursor: "pointer",
						border: "none",
						transition: "all 0.15s ease",
						alignSelf: "flex-start",
						_hover: {
							bg: "red.10",
						},
					})}
				>
					アカウントを削除
				</button>
			</section>

			{/* 削除確認ダイアログ */}
			<DeleteAccountDialog
				isOpen={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
			/>
		</div>
	);
}
