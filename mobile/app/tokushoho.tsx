import { ScrollView, Text, View } from "react-native";

const rows = [
	{ label: "事業者", value: "合同会社Ignission" },
	{ label: "運営責任者", value: "西立野 翔磨" },
	{
		label: "所在地",
		value:
			"〒103-0007 東京都中央区日本橋浜町三丁目19番4号 WAVES日本橋浜町 1201",
	},
	{ label: "連絡先", value: "miipa@ignission.tech" },
	{ label: "販売価格", value: "無料" },
	{
		label: "提供時期",
		value: "アカウント登録後すぐにご利用いただけます",
	},
	{ label: "支払方法", value: "該当なし（無料サービス）" },
	{
		label: "返品・解約",
		value: "マイページからいつでもアカウントを削除できます",
	},
	{ label: "推奨環境", value: "Chrome / Safari / Edge 最新版" },
] as const;

export default function TokushohoScreen() {
	return (
		<ScrollView className="flex-1 bg-bg-canvas p-6">
			<View className="mx-auto max-w-2xl">
				<Text className="text-2xl font-bold text-fg">
					特定商取引法に基づく表記
				</Text>
				<Text className="mt-2 text-xs text-fg-muted">
					最終更新日: 2026年2月8日
				</Text>

				<View className="mt-6 rounded-lg border border-border bg-bg">
					{rows.map((row, index) => (
						<View
							key={row.label}
							className={`flex-row border-border p-4 ${
								index < rows.length - 1 ? "border-b" : ""
							}`}
						>
							<Text className="w-28 shrink-0 text-sm font-semibold text-fg">
								{row.label}
							</Text>
							<Text className="flex-1 text-sm text-fg-muted">
								{row.value}
							</Text>
						</View>
					))}
				</View>
			</View>
		</ScrollView>
	);
}
