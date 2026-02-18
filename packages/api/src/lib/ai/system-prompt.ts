/**
 * システムプロンプト定義モジュール
 *
 * ミーアキャットキャラクター「miipa」のシステムプロンプトを構築します。
 * 現在のJST日時を動的に埋め込み、キャラクター設定と制約を定義します。
 *
 * @module lib/ai/system-prompt
 */

// ============================================================
// JSTフォーマット
// ============================================================

/** 曜日ラベル */
const DAY_OF_WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * 数値を2桁ゼロ埋めにフォーマット
 *
 * @param n - フォーマット対象の数値
 * @returns 2桁のゼロ埋め文字列
 */
function pad2(n: number): string {
	return n.toString().padStart(2, "0");
}

/**
 * JST日時を「YYYY年MM月DD日（曜日） HH:MM」形式にフォーマット
 *
 * @param jstDate - JSTに変換済みのDateオブジェクト
 * @returns フォーマット済みの日時文字列
 */
function formatJstDateTime(jstDate: Date): string {
	const year = jstDate.getUTCFullYear();
	const month = pad2(jstDate.getUTCMonth() + 1);
	const day = pad2(jstDate.getUTCDate());
	const dayOfWeek = DAY_OF_WEEK_LABELS[jstDate.getUTCDay()];
	const hours = pad2(jstDate.getUTCHours());
	const minutes = pad2(jstDate.getUTCMinutes());

	return `${year}年${month}月${day}日（${dayOfWeek}） ${hours}:${minutes}`;
}

// ============================================================
// システムプロンプト構築
// ============================================================

/**
 * miipaのシステムプロンプトを構築
 *
 * 現在時刻をJSTで埋め込み、キャラクター設定・行動指針・制約事項を
 * 含むシステムプロンプトを生成します。
 *
 * @returns 構築済みのシステムプロンプト文字列
 *
 * @example
 * ```typescript
 * import { buildSystemPrompt } from "@/lib/ai/system-prompt";
 *
 * const systemPrompt = buildSystemPrompt();
 * // LLMのsystemPromptパラメータに渡して使用
 * ```
 */
export function buildSystemPrompt(): string {
	const now = new Date();
	const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
	const formattedDateTime = formatJstDateTime(jstNow);

	return `あなたは「miipa（ミーパ）」という名前のミーアキャットのAIアシスタントです。
一人社長の予定管理をサポートする頼れるパートナーです。

## 現在の日時
${formattedDateTime}（JST）

## キャラクター設定
- 一人称は「僕」を使う
- 親しみやすく丁寧な口調で話す
- 簡潔に要点をまとめて回答する
- ミーアキャットらしく、周囲をよく見渡して情報を整理するのが得意

## 行動指針
- ユーザーの「今日」「今週」の予定を素早く把握できるよう支援する
- 時刻は必ずJST（日本標準時）で表示する
- カレンダーの予定を聞かれたら、ツールを使って最新の情報を取得する
- 予定の空き時間を聞かれたら、find_free_slotsツールを使って提案する
- 回答は30秒で読める分量に収める

## 制約事項
- カレンダーは読み取り専用。予定の作成・変更・削除はできない
- 予定の作成や変更を求められた場合は、丁寧にできない旨を伝える
- カレンダー以外の話題にも対応するが、本来の役割はカレンダー支援であることを意識する
- 機密情報や個人情報の取り扱いには十分注意する

## 応答フォーマット
- 日本語で回答する
- 予定一覧を表示する際は見やすく整形する
- 時刻は「HH:MM」形式、日付は「MM/DD（曜日）」形式を基本とする`;
}
