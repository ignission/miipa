/**
 * 設定型定義モジュール
 *
 * SoloDayアプリケーションの設定に関する型定義とZodスキーマを提供します。
 * ランタイムバリデーションと型推論を両立し、型安全な設定管理を実現します。
 *
 * ## 提供する型
 *
 * ### LLMConfig
 * LLMプロバイダの設定（Claude、OpenAI、Ollama対応）
 *
 * ### CalendarConfig
 * カレンダー設定（Google Calendar、iCal対応）
 *
 * ### UIConfig
 * ユーザーインターフェース設定（テーマ、言語）
 *
 * ### AppConfig
 * アプリケーション全体の設定をまとめたルート型
 *
 * @module lib/config/types
 *
 * @example
 * ```typescript
 * import {
 *   type AppConfig,
 *   type LLMConfig,
 *   type CalendarConfig,
 *   type UIConfig,
 *   AppConfigSchema,
 *   DEFAULT_CONFIG,
 * } from '@/lib/config/types';
 *
 * // スキーマによるバリデーション
 * const result = AppConfigSchema.safeParse(unknownData);
 * if (result.success) {
 *   const config: AppConfig = result.data;
 * }
 * ```
 */

import { z } from "zod";
import { type CalendarId, createCalendarId } from "@/lib/domain/shared/types";

// ドメイン型の再エクスポート（カレンダー設定で使用）
export type { CalendarId };
export { createCalendarId };

// ============================================================
// LLMプロバイダ設定
// ============================================================

/**
 * LLMプロバイダ識別子
 *
 * 対応するLLMプロバイダを識別するための文字列リテラル型です。
 * - `claude`: Anthropic Claude API
 * - `openai`: OpenAI API
 * - `ollama`: ローカルOllama
 */
export type LLMProvider = "claude" | "openai" | "ollama";

/**
 * LLMプロバイダ設定のZodスキーマ
 *
 * @remarks
 * - `provider`: 使用するLLMプロバイダ（必須）
 * - `model`: モデル名（オプション、プロバイダデフォルトを使用）
 * - `apiKeyRef`: APIキーの参照名（Keychainから取得するためのキー）
 * - `baseUrl`: Ollama用カスタムURL（オプション）
 */
export const LLMConfigSchema = z.object({
	/** 使用するLLMプロバイダ */
	provider: z
		.enum(["claude", "openai", "ollama"])
		.default("claude")
		.describe("LLMプロバイダの識別子"),

	/** モデル名（省略時はプロバイダのデフォルトモデルを使用） */
	model: z
		.string()
		.optional()
		.describe("使用するモデル名（省略時はデフォルト）"),

	/** APIキーの参照名（Keychainのキー名） */
	apiKeyRef: z
		.string()
		.optional()
		.describe("macOS Keychainに保存されたAPIキーの参照名"),

	/** Ollama用カスタムベースURL */
	baseUrl: z
		.string()
		.url()
		.optional()
		.describe("OllamaのカスタムベースURL（ローカル以外の場合）"),
});

/**
 * LLMプロバイダ設定
 *
 * AIアシスタント機能で使用するLLMの設定を定義します。
 * Claude、OpenAI、Ollamaの3つのプロバイダに対応しています。
 *
 * @example
 * ```typescript
 * const llmConfig: LLMConfig = {
 *   provider: 'claude',
 *   model: 'claude-3-opus-20240229',
 *   apiKeyRef: 'anthropic-api-key',
 * };
 * ```
 */
export type LLMConfig = z.infer<typeof LLMConfigSchema>;

// ============================================================
// カレンダー設定
// ============================================================

/**
 * カレンダータイプ識別子
 *
 * 対応するカレンダーソースを識別するための文字列リテラル型です。
 * - `google`: Google Calendar API
 * - `ical`: iCal形式のURL（読み取り専用）
 */
export type CalendarType = "google" | "ical";

/**
 * カレンダー設定のZodスキーマ
 *
 * lib/domain/calendar/types.ts の CalendarConfig インターフェースと
 * 整合性を保つように設計されています。
 *
 * @remarks
 * - `id`: CalendarId（ブランド型）として使用される一意識別子
 * - `type`: カレンダーの種類（google/ical）
 * - `name`: ユーザー向け表示名
 * - `enabled`: 有効/無効フラグ
 * - `color`: UI表示用カラーコード（任意）
 * - `googleAccountEmail`: Googleアカウントのメールアドレス（Google固有）
 * - `googleCalendarId`: GoogleカレンダーのID（Google固有）
 * - `icalUrl`: iCalのURL（iCal固有）
 */
export const CalendarConfigSchema = z.object({
	/** カレンダーの一意識別子（CalendarIdとして使用） */
	id: z
		.string()
		.min(1)
		.describe("カレンダーを一意に識別するID")
		.transform((val) => createCalendarId(val)),

	/** カレンダーの種類 */
	type: z.enum(["google", "ical"]).describe("カレンダーソースの種類"),

	/** カレンダーの表示名 */
	name: z.string().min(1).describe("ユーザーに表示されるカレンダー名"),

	/** カレンダーの有効/無効 */
	enabled: z.boolean().default(true).describe("カレンダーが有効かどうか"),

	/** 表示用カラーコード（任意） */
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/)
		.optional()
		.describe("HEX形式のカラーコード（例: #FF5733）"),

	/** Googleアカウントのメールアドレス（type='google'の場合） */
	googleAccountEmail: z
		.string()
		.email()
		.optional()
		.describe("Googleアカウントのメールアドレス"),

	/** GoogleカレンダーのID（type='google'の場合） */
	googleCalendarId: z
		.string()
		.optional()
		.describe("GoogleカレンダーのID（'primary'または具体的なカレンダーID）"),

	/** iCalのURL（type='ical'の場合） */
	icalUrl: z.string().url().optional().describe("iCal形式のカレンダーURL"),
});

/**
 * カレンダー設定
 *
 * 個々のカレンダーソースの設定を定義します。
 * Google CalendarとiCal形式のURLに対応しています。
 *
 * lib/domain/calendar/types.ts の CalendarConfig インターフェースと
 * 同等の構造を持ちますが、こちらはZodスキーマから推論された型です。
 *
 * @property id - CalendarId（ブランド型）として使用される一意識別子
 * @property type - カレンダーの種類（google | ical）
 * @property name - カレンダーの表示名
 * @property enabled - カレンダーが有効かどうか
 * @property color - カレンダーの表示色（任意）
 * @property googleAccountEmail - Googleアカウントのメールアドレス（Google固有）
 * @property googleCalendarId - GoogleカレンダーのID（Google固有）
 * @property icalUrl - iCalのURL（iCal固有）
 *
 * @example
 * ```typescript
 * // Google Calendarの設定
 * const googleCalendar: CalendarConfig = {
 *   id: createCalendarId('google-work'),
 *   type: 'google',
 *   name: '仕事用カレンダー',
 *   enabled: true,
 *   color: '#4285F4',
 *   googleAccountEmail: 'user@gmail.com',
 *   googleCalendarId: 'primary',
 * };
 *
 * // iCalの設定
 * const icalCalendar: CalendarConfig = {
 *   id: createCalendarId('ical-holidays'),
 *   type: 'ical',
 *   name: '日本の祝日',
 *   enabled: true,
 *   color: '#EA4335',
 *   icalUrl: 'https://example.com/calendar.ics',
 * };
 * ```
 */
export type CalendarConfig = z.infer<typeof CalendarConfigSchema>;

// ============================================================
// UI設定
// ============================================================

/**
 * テーマ設定
 *
 * アプリケーションの外観テーマを指定します。
 * - `light`: ライトモード
 * - `dark`: ダークモード
 * - `system`: システム設定に追従
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * 言語設定
 *
 * アプリケーションの表示言語を指定します。
 * - `ja`: 日本語
 * - `en`: 英語
 */
export type Locale = "ja" | "en";

/**
 * UI設定のZodスキーマ
 *
 * @remarks
 * - `theme`: 外観テーマ（light/dark/system）
 * - `language`: 表示言語（ja/en）
 */
export const UIConfigSchema = z.object({
	/** 外観テーマ */
	theme: z
		.enum(["light", "dark", "system"])
		.default("system")
		.describe("アプリケーションの外観テーマ"),

	/** 表示言語 */
	language: z
		.enum(["ja", "en"])
		.default("ja")
		.describe("アプリケーションの表示言語"),
});

/**
 * UI設定
 *
 * ユーザーインターフェースの表示設定を定義します。
 * テーマと言語の設定を含みます。
 *
 * @example
 * ```typescript
 * const uiConfig: UIConfig = {
 *   theme: 'system',
 *   language: 'ja',
 * };
 * ```
 */
export type UIConfig = z.infer<typeof UIConfigSchema>;

// ============================================================
// アプリケーション設定（ルート型）
// ============================================================

/**
 * アプリケーション設定のZodスキーマ
 *
 * SoloDayアプリケーション全体の設定を定義するルートスキーマです。
 * このスキーマを使用して `~/.soloday/config.json` をバリデーションします。
 *
 * @remarks
 * - `version`: 設定ファイルのバージョン（マイグレーション用）
 * - `llm`: LLMプロバイダ設定
 * - `calendars`: カレンダー設定の配列
 * - `ui`: UI設定
 */
export const AppConfigSchema = z.object({
	/** 設定ファイルのバージョン */
	version: z
		.string()
		.regex(/^\d+\.\d+\.\d+$/)
		.default("1.0.0")
		.describe("設定ファイルのバージョン（semver形式）"),

	/** LLMプロバイダ設定 */
	llm: LLMConfigSchema.default({
		provider: "claude",
	}).describe("AIアシスタントで使用するLLMの設定"),

	/** カレンダー設定の配列 */
	calendars: z
		.array(CalendarConfigSchema)
		.default([])
		.describe("連携するカレンダーの設定リスト"),

	/** UI設定 */
	ui: UIConfigSchema.default({
		theme: "system",
		language: "ja",
	}).describe("ユーザーインターフェースの表示設定"),
});

/**
 * アプリケーション設定
 *
 * SoloDayアプリケーション全体の設定を定義するルート型です。
 * この型はZodスキーマから推論されており、ランタイムバリデーションと
 * 型チェックが完全に一致することを保証しています。
 *
 * @remarks
 * 設定ファイルは `~/.soloday/config.json` に保存されます。
 * readonlyプロパティとして扱うことで、不変性を保証します。
 *
 * @example
 * ```typescript
 * import { AppConfigSchema, type AppConfig } from '@/lib/config/types';
 *
 * // 未知のデータをバリデーション
 * const result = AppConfigSchema.safeParse(jsonData);
 * if (result.success) {
 *   const config: AppConfig = result.data;
 *   console.log(config.llm.provider); // 'claude'
 * } else {
 *   console.error(result.error.issues);
 * }
 * ```
 */
export type AppConfig = z.infer<typeof AppConfigSchema>;

// ============================================================
// デフォルト設定
// ============================================================

/**
 * デフォルトのアプリケーション設定
 *
 * 初回起動時や設定ファイルが存在しない場合に使用されるデフォルト値です。
 * Zodスキーマのdefault値から自動生成されます。
 *
 * @remarks
 * このオブジェクトはreadonly（Object.freeze）として扱われます。
 * 直接変更せず、コピーして使用してください。
 *
 * @example
 * ```typescript
 * import { DEFAULT_CONFIG } from '@/lib/config/types';
 *
 * // デフォルト設定を基にカスタマイズ
 * const customConfig: AppConfig = {
 *   ...DEFAULT_CONFIG,
 *   llm: {
 *     ...DEFAULT_CONFIG.llm,
 *     model: 'claude-3-opus-20240229',
 *   },
 * };
 * ```
 */
export const DEFAULT_CONFIG: Readonly<AppConfig> = Object.freeze(
	AppConfigSchema.parse({}),
);

// ============================================================
// 型ガード
// ============================================================

/**
 * 値がLLMProviderかどうかを判定する型ガード
 *
 * @param value - 検証する値
 * @returns 値がLLMProviderの場合はtrue
 *
 * @example
 * ```typescript
 * const provider: unknown = 'claude';
 * if (isLLMProvider(provider)) {
 *   // provider は LLMProvider 型として扱える
 * }
 * ```
 */
export function isLLMProvider(value: unknown): value is LLMProvider {
	return value === "claude" || value === "openai" || value === "ollama";
}

/**
 * 値がCalendarTypeかどうかを判定する型ガード
 *
 * @param value - 検証する値
 * @returns 値がCalendarTypeの場合はtrue
 *
 * @example
 * ```typescript
 * const type: unknown = 'google';
 * if (isCalendarType(type)) {
 *   // type は CalendarType 型として扱える
 * }
 * ```
 */
export function isCalendarType(value: unknown): value is CalendarType {
	return value === "google" || value === "ical";
}

/**
 * 値がThemeModeかどうかを判定する型ガード
 *
 * @param value - 検証する値
 * @returns 値がThemeModeの場合はtrue
 */
export function isThemeMode(value: unknown): value is ThemeMode {
	return value === "light" || value === "dark" || value === "system";
}

/**
 * 値がLocaleかどうかを判定する型ガード
 *
 * @param value - 検証する値
 * @returns 値がLocaleの場合はtrue
 */
export function isLocale(value: unknown): value is Locale {
	return value === "ja" || value === "en";
}
