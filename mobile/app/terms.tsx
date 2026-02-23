import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

function SectionTitle({ children }: { children: string }) {
	return (
		<Text className="mt-8 mb-3 text-lg font-bold text-fg">{children}</Text>
	);
}

function Paragraph({ children }: { children: React.ReactNode }) {
	return <Text className="mt-2 text-sm leading-6 text-fg">{children}</Text>;
}

function ListItem({ children }: { children: string }) {
	return (
		<View className="mt-1 flex-row pl-2">
			<Text className="text-sm leading-6 text-fg">・</Text>
			<Text className="flex-1 text-sm leading-6 text-fg">{children}</Text>
		</View>
	);
}

export default function TermsScreen() {
	return (
		<ScrollView className="flex-1 bg-bg-canvas p-6">
			<View className="mx-auto max-w-2xl pb-12">
				<Text className="text-2xl font-bold text-fg">利用規約</Text>
				<Text className="mt-2 text-xs text-fg-muted">
					最終更新日: 2026年2月8日
				</Text>

				<Paragraph>
					この利用規約（以下「本規約」といいます）は、合同会社Ignission（以下「当社」といいます）が提供するmiipa（以下「本サービス」といいます）の利用条件を定めるものです。ユーザーの皆さま（以下「ユーザー」といいます）は、本規約に同意のうえ、本サービスをご利用いただきます。
				</Paragraph>

				<SectionTitle>第1条 アカウントおよび利用資格</SectionTitle>
				<ListItem>
					本サービスの利用には、Googleアカウントによる認証が必要です。
				</ListItem>
				<ListItem>
					ユーザーは、認証に使用するアカウント情報が正確かつ最新であることを維持する義務を負います。
				</ListItem>
				<ListItem>
					ユーザーは、自己のアカウントを第三者に利用させ、または貸与、譲渡、売買その他の処分をしてはなりません。
				</ListItem>
				<ListItem>
					アカウントの管理不十分、使用上の過誤、または第三者の不正使用等によって生じた損害について、当社は一切の責任を負いません。
				</ListItem>

				<SectionTitle>第2条 サービスの内容</SectionTitle>
				<Paragraph>
					本サービスは、以下の機能を提供するWebアプリケーションです。
				</Paragraph>
				<ListItem>Googleカレンダーとの連携による予定の統合表示</ListItem>
				<ListItem>
					AIアシスタントによるカレンダーデータの分析および情報提供
				</ListItem>
				<ListItem>
					カレンダーデータへの読み取り専用アクセス（データの変更・削除は行いません）
				</ListItem>
				<Paragraph>
					当社は、本サービスの内容を予告なく変更、追加、または廃止することができるものとします。これによりユーザーに生じた損害について、当社は一切の責任を負いません。
				</Paragraph>

				<SectionTitle>第3条 サービス利用許諾</SectionTitle>
				<ListItem>
					当社は、ユーザーに対し、本規約に従い、本サービスを利用するための非独占的かつ取消可能な利用許諾を付与します。
				</ListItem>
				<ListItem>
					ユーザーは、本サービスのソフトウェアについて、リバースエンジニアリング、逆コンパイル、逆アセンブルその他これらに類する行為を行ってはなりません。
				</ListItem>
				<ListItem>
					ユーザーは、本サービスを第三者に再販売、再配布、またはサブライセンスしてはなりません。
				</ListItem>

				<SectionTitle>第4条 ユーザーコンテンツおよび知的財産権</SectionTitle>
				<ListItem>
					本サービスを通じてアクセスされるカレンダーデータの権利は、ユーザーに帰属します。当社は、本サービスの提供に必要な範囲でのみ当該データを利用します。
				</ListItem>
				<ListItem>
					本サービスに関するソフトウェア、デザイン、ロゴ、その他すべての知的財産権は当社に帰属します。
				</ListItem>
				<ListItem>
					本規約に基づく利用許諾は、当社の知的財産権の譲渡を意味するものではありません。
				</ListItem>

				<SectionTitle>第5条 禁止行為</SectionTitle>
				<Paragraph>
					ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
				</Paragraph>
				<ListItem>法令または公序良俗に違反する行為</ListItem>
				<ListItem>
					本サービスのサーバーまたはネットワークに対する不正アクセス、過度な負荷をかける行為
				</ListItem>
				<ListItem>
					本サービスの運営を妨害し、または妨害するおそれのある行為
				</ListItem>
				<ListItem>他のユーザーまたは第三者の権利を侵害する行為</ListItem>
				<ListItem>一人のユーザーが複数のアカウントを作成する行為</ListItem>
				<ListItem>
					自動化されたスクリプト等を用いて本サービスにアクセスする行為
				</ListItem>
				<ListItem>その他、当社が不適切と合理的に判断する行為</ListItem>

				<SectionTitle>第6条 プライバシー</SectionTitle>
				<Paragraph>
					ユーザーの個人情報の取扱いについては、当社が別途定めるプライバシーポリシーに従います。ユーザーは、本サービスの利用に際し、プライバシーポリシーに同意するものとします。
				</Paragraph>

				<SectionTitle>第7条 解約およびサービス停止</SectionTitle>
				<ListItem>
					当社は、ユーザーが本規約に違反した場合、事前の通知なく、当該ユーザーのアカウントを停止または削除することができるものとします。
				</ListItem>
				<ListItem>
					ユーザーは、いつでも本サービスの利用を中止し、アカウントの削除を当社に申し出ることができます。
				</ListItem>
				<ListItem>
					アカウント削除後、当社は当該ユーザーのデータを合理的な期間内に削除します。ただし、法令上の保存義務がある場合はこの限りではありません。
				</ListItem>

				<SectionTitle>第8条 免責事項</SectionTitle>
				<ListItem>
					本サービスは「現状有姿」で提供されます。当社は、本サービスに関して、明示的または黙示的を問わず、商品性、特定目的への適合性、正確性、完全性、信頼性その他いかなる保証も行いません。
				</ListItem>
				<ListItem>
					AIアシスタントによる分析結果は参考情報であり、その正確性、完全性を保証するものではありません。ユーザーは、AIの出力に基づく判断および行動について、自己の責任で行うものとします。
				</ListItem>
				<ListItem>
					天災地変、戦争、テロ、暴動、法令の改正、政府機関の命令、通信回線の障害、その他当社の合理的な支配を超える不可抗力により生じた損害について、当社は一切の責任を負いません。
				</ListItem>
				<ListItem>
					本サービスの中断、停止、終了、データの喪失、バグその他本サービスに関連してユーザーに生じた損害について、当社の故意または重過失による場合を除き、当社は一切の責任を負いません。
				</ListItem>

				<SectionTitle>第9条 責任の制限</SectionTitle>
				<Paragraph>
					当社がユーザーに対して損害賠償責任を負う場合であっても、当社の賠償責任は、直接かつ現実に生じた通常の損害に限るものとし、逸失利益、間接損害、特別損害、偶発的損害、結果的損害その他の損害については、予見の有無を問わず、一切の責任を負いません。なお、本サービスは無料で提供されるため、損害賠償の上限額はゼロ円とします。
				</Paragraph>

				<SectionTitle>第10条 規約変更</SectionTitle>
				<ListItem>
					当社は、必要に応じて本規約を変更することができるものとします。変更後の規約は、本サービス上への掲載をもって効力を生じます。
				</ListItem>
				<ListItem>
					規約変更後にユーザーが本サービスの利用を継続した場合、当該ユーザーは変更後の規約に同意したものとみなします。
				</ListItem>

				<SectionTitle>第11条 準拠法</SectionTitle>
				<Paragraph>
					本規約の解釈および適用は、日本法に準拠するものとします。本規約に関する紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
				</Paragraph>

				<SectionTitle>第12条 お問い合わせ</SectionTitle>
				<Paragraph>
					本規約に関するお問い合わせは、以下の連絡先までお願いいたします。
				</Paragraph>
				<View className="mt-3 rounded-lg bg-bg-subtle p-4">
					<Text className="text-sm font-semibold text-fg">
						合同会社Ignission
					</Text>
					<Text className="mt-1 text-sm text-fg-muted">
						メール: miipa@ignission.tech
					</Text>
				</View>

				<View className="mt-8 border-t border-border-muted pt-4">
					<Link href="/privacy">
						<Text className="text-sm text-accent">
							プライバシーポリシーはこちら
						</Text>
					</Link>
				</View>
			</View>
		</ScrollView>
	);
}
