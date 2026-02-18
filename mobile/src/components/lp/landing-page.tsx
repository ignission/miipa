/**
 * ランディングページコンポーネント（Web only）
 *
 * miipa の魅力を伝えるLPとして機能し、サインインへ誘導します。
 * Platform.OS === "web" でのみ表示されることを想定しています。
 *
 * @module components/lp/landing-page
 */

import {
	Image,
	Linking,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";

// ============================================================
// 型定義
// ============================================================

/**
 * LandingPageコンポーネントのProps
 */
interface LandingPageProps {
	/** サインインハンドラ */
	onSignIn: () => void;
}

// ============================================================
// サブコンポーネント
// ============================================================

/**
 * 特徴カード
 */
function FeatureCard({
	emoji,
	title,
	description,
	comingSoon,
}: {
	emoji: string;
	title: string;
	description: string;
	comingSoon?: boolean;
}) {
	return (
		<View className="flex-1 items-center gap-4 rounded-xl border border-border bg-bg-subtle p-6 md:p-8">
			<Text className="text-4xl md:text-5xl">{emoji}</Text>
			<View className="flex-row items-center gap-2">
				<Text className="text-center text-lg font-bold text-fg md:text-xl">
					{title}
				</Text>
				{comingSoon && (
					<Text className="text-xs text-fg-muted">(近日実装予定)</Text>
				)}
			</View>
			<Text className="text-center text-sm leading-relaxed text-fg-muted">
				{description}
			</Text>
		</View>
	);
}

/**
 * ステップカード
 */
function StepCard({
	number,
	title,
	description,
	comingSoon,
}: {
	number: number;
	title: string;
	description: string;
	comingSoon?: boolean;
}) {
	return (
		<View className="flex-1 items-center gap-4">
			<View className="h-14 w-14 items-center justify-center rounded-full bg-[#C8893A]">
				<Text className="text-xl font-bold text-white">{number}</Text>
			</View>
			<View className="flex-row items-center gap-2">
				<Text className="text-center text-lg font-bold text-fg md:text-xl">
					{title}
				</Text>
				{comingSoon && (
					<Text className="text-xs text-fg-muted">(近日実装予定)</Text>
				)}
			</View>
			<Text className="text-center text-sm leading-relaxed text-fg-muted">
				{description}
			</Text>
		</View>
	);
}

/**
 * CTAボタン
 */
function CTAButton({ onPress, label }: { onPress: () => void; label: string }) {
	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center justify-center gap-3 rounded-xl bg-[#C8893A] px-8 py-4 shadow-lg active:bg-[#B07830]"
		>
			<Text className="text-lg font-bold text-white">{label}</Text>
		</Pressable>
	);
}

// ============================================================
// メインコンポーネント
// ============================================================

/**
 * ランディングページ
 *
 * Hero、特徴、使い方、CTA、フッターの5セクションで構成。
 * Web only コンポーネント。
 *
 * @param props - コンポーネントのProps
 * @returns ランディングページ要素
 */
export function LandingPage({ onSignIn }: LandingPageProps) {
	// モバイルでは表示しない
	if (Platform.OS !== "web") {
		return null;
	}

	return (
		<ScrollView className="min-h-screen bg-bg-canvas">
			{/* ===== セクション1: Hero ===== */}
			<View className="items-center justify-center px-6 py-20 md:min-h-[90vh] md:px-8 md:py-24">
				{/* ロゴ */}
				<Image
					// eslint-disable-next-line @typescript-eslint/no-require-imports
					source={require("../../../assets/images/icon.png")}
					style={{ width: 96, height: 96 }}
					accessibilityLabel="miipa ミーアキャット"
				/>

				{/* キャッチコピー */}
				<Text className="mt-8 text-center text-3xl font-bold leading-tight tracking-tight text-fg md:text-5xl">
					今日のあなたを、30秒で把握。
				</Text>

				{/* サブコピー */}
				<Text className="mt-4 max-w-2xl text-center text-base leading-relaxed text-fg-muted md:text-xl">
					複数のGoogleカレンダーを統合し、AIが一人社長の一日をスマートにナビゲート。
				</Text>

				{/* CTAボタン */}
				<View className="mt-8">
					<CTAButton onPress={onSignIn} label="Googleで無料で始める" />
				</View>

				{/* 補足テキスト */}
				<Text className="mt-4 text-sm text-fg-muted">
					無料で始める · クレジットカード不要
				</Text>
			</View>

			{/* ===== セクション2: 3つの特徴 ===== */}
			<View className="bg-bg px-6 py-16 md:px-8 md:py-24">
				<Text className="mb-10 text-center text-2xl font-bold text-fg md:mb-16 md:text-3xl">
					miipaが選ばれる理由
				</Text>

				<View className="mx-auto w-full max-w-5xl gap-6 md:flex-row md:gap-8">
					<FeatureCard
						emoji="📅"
						title="30秒で今日を把握"
						description="複数カレンダーの予定を一画面に統合。朝のルーティンが変わります。"
					/>
					<FeatureCard
						emoji="✨"
						title="AIがあなたの予定を分析"
						description="今日の予定の優先度や空き時間をAIが読み解き、的確な洞察を提供。"
						comingSoon
					/>
					<FeatureCard
						emoji="🛡️"
						title="安心のread-only"
						description="カレンダーの読み取りのみ。予定の変更・削除は一切行いません。"
					/>
				</View>
			</View>

			{/* ===== セクション3: 使い方3ステップ ===== */}
			<View className="px-6 py-16 md:px-8 md:py-24">
				<Text className="mb-10 text-center text-2xl font-bold text-fg md:mb-16 md:text-3xl">
					かんたん3ステップ
				</Text>

				<View className="mx-auto w-full max-w-5xl gap-8 md:flex-row md:gap-12">
					<StepCard
						number={1}
						title="Googleアカウントでサインイン"
						description="お使いのGoogleアカウントでワンクリックログイン。面倒な登録は不要です。"
					/>
					<StepCard
						number={2}
						title="カレンダーを選択・統合"
						description="表示したいカレンダーを選ぶだけ。複数のカレンダーを一つにまとめます。"
					/>
					<StepCard
						number={3}
						title="AIに今日の予定を聞くだけ"
						description="「今日の予定は？」と聞くだけで、AIが予定を整理して教えてくれます。"
						comingSoon
					/>
				</View>
			</View>

			{/* ===== セクション4: CTA（再度） ===== */}
			<View className="items-center bg-bg px-6 py-16 md:px-8 md:py-24">
				<Text className="text-center text-2xl font-bold text-fg md:text-3xl">
					さあ、始めましょう
				</Text>
				<Text className="mt-4 max-w-xl text-center text-base leading-relaxed text-fg-muted md:text-lg">
					毎朝のカレンダーチェックを、もっとスマートに。
				</Text>

				<View className="mt-6">
					<CTAButton onPress={onSignIn} label="今すぐ無料で始める" />
				</View>

				<Text className="mt-4 text-sm text-fg-muted">
					クレジットカード不要 · いつでも退会可能
				</Text>
			</View>

			{/* ===== セクション5: フッター ===== */}
			<View className="items-center border-t border-border px-6 py-8">
				<Text className="text-sm text-fg-muted">miipa &copy; 2026</Text>

				<View className="mt-4 flex-row gap-6">
					<Pressable onPress={() => Linking.openURL("/privacy")}>
						<Text className="text-sm text-fg-muted">プライバシーポリシー</Text>
					</Pressable>
					<Pressable onPress={() => Linking.openURL("/terms")}>
						<Text className="text-sm text-fg-muted">利用規約</Text>
					</Pressable>
					<Pressable onPress={() => Linking.openURL("/tokushoho")}>
						<Text className="text-sm text-fg-muted">特商法表記</Text>
					</Pressable>
				</View>
			</View>
		</ScrollView>
	);
}
