import { Linking, ScrollView, Text, View } from "react-native";

function SectionTitle({ children }: { children: string }) {
	return <Text className="mt-8 text-lg font-bold text-fg">{children}</Text>;
}

function Paragraph({ children }: { children: React.ReactNode }) {
	return (
		<Text className="mt-3 text-sm leading-6 text-fg-muted">{children}</Text>
	);
}

function ListItem({ children }: { children: string }) {
	return (
		<Text className="mt-1 pl-4 text-sm leading-6 text-fg-muted">
			{children}
		</Text>
	);
}

function BulletItem({ children }: { children: string }) {
	return (
		<Text className="mt-1 pl-4 text-sm leading-6 text-fg-muted">
			・{children}
		</Text>
	);
}

export default function PrivacyScreen() {
	return (
		<ScrollView className="flex-1 bg-bg-canvas p-6">
			<View className="mx-auto max-w-2xl pb-12">
				<Text className="text-2xl font-bold text-fg">プライバシーポリシー</Text>
				<Text className="mt-2 text-sm text-fg-muted">
					最終更新日: 2026年2月8日
				</Text>

				<Paragraph>
					合同会社Ignission（以下「当社」といいます。）は、当社が提供するサービス「miipa」（以下「本サービス」といいます。）におけるユーザーのプライバシー情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
				</Paragraph>

				<SectionTitle>第1条（プライバシー情報の定義）</SectionTitle>
				<ListItem>
					1.
					「個人情報」とは、個人情報保護法にいう「個人情報」を指し、生存する個人に関する情報であって、氏名、メールアドレス、プロフィール画像その他の記述等により特定の個人を識別できる情報を指します。
				</ListItem>
				<ListItem>
					2.
					「履歴情報」とは、本サービスの利用に伴い記録される利用履歴、アクセスログ、操作履歴等の情報を指します。
				</ListItem>
				<ListItem>
					3.
					「カレンダーデータ」とは、ユーザーのGoogleカレンダーから読み取りにより取得するイベント情報（予定のタイトル、日時、場所、説明等）を指します。
				</ListItem>

				<SectionTitle>第2条（プライバシー情報の収集）</SectionTitle>
				<Paragraph>
					当社は、本サービスの提供にあたり、以下の方法でプライバシー情報を収集します。
				</Paragraph>
				<ListItem>
					1.
					ユーザーがGoogleアカウントでログインする際に、Googleアカウント情報（氏名、メールアドレス、プロフィール画像）を取得します。
				</ListItem>
				<ListItem>
					2.
					ユーザーの同意に基づき、Googleカレンダーのイベントデータを読み取り専用で取得します。
				</ListItem>
				<ListItem>
					3.
					本サービスの利用に伴い、アクセスログ、利用履歴等の履歴情報を自動的に収集します。
				</ListItem>
				<Paragraph>収集した情報の保持期間は以下のとおりとします。</Paragraph>
				<BulletItem>
					アカウント情報：退会後最大1年間保持した後、削除します。
				</BulletItem>
				<BulletItem>
					利用ログ・アクセスログ：収集から12ヶ月間保持した後、削除します。
				</BulletItem>
				<BulletItem>
					カレンダーデータ：サービス提供に必要な期間のみ保持し、不要となった時点で速やかに削除します。
				</BulletItem>

				<SectionTitle>第3条（収集・利用目的）</SectionTitle>
				<Paragraph>
					当社がプライバシー情報を収集・利用する目的は、以下のとおりです。
				</Paragraph>
				<ListItem>1. ユーザーの認証およびアカウント管理のため</ListItem>
				<ListItem>
					2. カレンダーイベントの表示および複数カレンダーの統合のため
				</ListItem>
				<ListItem>
					3. AIアシスタントによるユーザーの予定分析および提案のため
				</ListItem>
				<ListItem>4. 本サービスの品質改善および機能向上のため</ListItem>
				<ListItem>5. 本サービスの不正利用の防止および対応のため</ListItem>
				<ListItem>6. ユーザーからのお問い合わせへの対応のため</ListItem>
				<ListItem>
					7. 利用規約に違反したユーザーの特定および利用停止措置のため
				</ListItem>
				<ListItem>8. 上記に付随する業務の遂行のため</ListItem>

				<SectionTitle>第4条（安全管理措置）</SectionTitle>
				<Paragraph>
					当社は、個人情報の漏えい、滅失またはき損の防止その他個人情報の安全管理のために、以下の措置を講じています。
				</Paragraph>
				<ListItem>
					1. 技術的措置：Web Crypto
					API（AES-256-GCM）を用いた認証情報およびトークンの暗号化、Cloudflare
					Workers上でのセキュアな通信環境の確保を行います。
				</ListItem>
				<ListItem>
					2.
					組織的措置：個人情報保護管理者（西立野翔磨）を選任し、個人情報の適切な管理・監督を行います。
				</ListItem>
				<ListItem>
					3.
					アクセス制御：個人情報へのアクセスを必要最小限に制限し、不正アクセスの防止に努めます。
				</ListItem>

				<SectionTitle>第4条の2（漏えい等の報告・通知）</SectionTitle>
				<Paragraph>
					当社は、個人情報の漏えい、滅失、き損その他の個人情報の安全の確保に係る事態が発生した場合は、速やかに事実関係を確認し、以下の対応を行います。
				</Paragraph>
				<ListItem>
					1.
					個人情報保護委員会への報告を、事態を認識した後速やかに（原則として72時間以内に）行います。
				</ListItem>
				<ListItem>
					2.
					影響を受けるユーザー本人に対し、速やかに当該事態の内容を通知します。
				</ListItem>
				<ListItem>3. 再発防止策を策定し、必要な措置を講じます。</ListItem>

				<SectionTitle>第5条（第三者提供）</SectionTitle>
				<Paragraph>
					当社は、ユーザーの個人情報を第三者に提供、販売、貸与することはありません。ただし、以下の場合はこの限りではありません。
				</Paragraph>
				<ListItem>1. 法令に基づく開示要求がある場合</ListItem>
				<ListItem>2. ユーザー本人の同意がある場合</ListItem>
				<ListItem>
					3.
					人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合
				</ListItem>
				<ListItem>
					4.
					公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難である場合
				</ListItem>
				<ListItem>
					5.
					国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
				</ListItem>

				<SectionTitle>第6条（Googleカレンダーデータの取扱い）</SectionTitle>
				<Paragraph>
					当社は、ユーザーのGoogleカレンダーデータについて、以下のとおり取り扱います。
				</Paragraph>
				<ListItem>
					1.
					カレンダーデータへのアクセスは読み取り専用（read-only）とし、ユーザーのカレンダーに対する変更、追加または削除は一切行いません。
				</ListItem>
				<ListItem>
					2. 取得したカレンダーデータは、Cloudflare
					D1データベースにキャッシュとして暗号化保存し、サービス提供に必要な期間のみ保持します。
				</ListItem>
				<ListItem>
					3.
					カレンダーデータは、AIアシスタントによる予定分析およびユーザーへの情報提供の目的のみに使用します。
				</ListItem>
				<ListItem>
					4.
					ユーザーがアカウントを削除した場合、当該ユーザーのカレンダーデータを速やかに削除します。
				</ListItem>

				<SectionTitle>第7条（保有個人データの開示等請求）</SectionTitle>
				<Paragraph>
					ユーザーは、当社に対し、個人情報保護法の定めに基づき、以下の請求を行うことができます。
				</Paragraph>
				<ListItem>1. 保有個人データの開示の請求</ListItem>
				<ListItem>2. 保有個人データの内容の訂正、追加または削除の請求</ListItem>
				<ListItem>3. 保有個人データの利用の停止または消去の請求</ListItem>
				<ListItem>4. 保有個人データの第三者への提供の停止の請求</ListItem>
				<Paragraph>
					上記の請求を行う場合は、第9条に定めるお問い合わせ窓口にご連絡ください。ご本人確認のうえ、合理的な期間内に対応いたします。
				</Paragraph>

				<SectionTitle>第8条（プライバシーポリシーの変更）</SectionTitle>
				<ListItem>
					1.
					当社は、法令の変更、本サービスの変更その他の事由により、本ポリシーを変更することがあります。
				</ListItem>
				<ListItem>
					2.
					本ポリシーを変更した場合、変更後の内容を本サービス上に掲載することにより通知します。
				</ListItem>
				<ListItem>
					3.
					ユーザーに重大な影響を及ぼす変更を行う場合は、変更の効力発生日の少なくとも30日前までに、本サービス上での告知またはメールにて事前に通知します。
				</ListItem>

				<SectionTitle>第9条（お問い合わせ窓口）</SectionTitle>
				<Paragraph>
					本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
				</Paragraph>
				<BulletItem>運営: 合同会社Ignission</BulletItem>
				<BulletItem>個人情報保護管理者: 西立野 翔磨</BulletItem>
				<View className="mt-1 flex-row pl-4">
					<Text className="text-sm leading-6 text-fg-muted">
						・メールアドレス:{" "}
					</Text>
					<Text
						className="text-sm leading-6 text-blue-500"
						onPress={() => Linking.openURL("mailto:miipa@ignission.tech")}
					>
						miipa@ignission.tech
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}
