/**
 * Google Calendar プロバイダ
 *
 * Google Calendar API との通信を担当するプロバイダ実装。
 * CalendarProvider インターフェースを実装し、カレンダー一覧取得と
 * イベント取得機能を提供します。
 *
 * ## 特徴
 *
 * - **calendar.readonly スコープのみ**: 読み取り専用アクセス
 * - **トークン自動リフレッシュ**: 期限切れ前に自動更新
 * - **Result型エラーハンドリング**: 型安全なエラー処理
 *
 * @module lib/infrastructure/calendar/google-provider
 *
 * @example
 * ```typescript
 * import { GoogleCalendarProvider } from '@/lib/infrastructure/calendar/google-provider';
 * import type { OAuthTokens } from '@/lib/infrastructure/calendar/token-store';
 *
 * // プロバイダを作成
 * const provider = new GoogleCalendarProvider('user@gmail.com', tokens);
 *
 * // カレンダー一覧を取得
 * const calendarsResult = await provider.getCalendars();
 * if (isOk(calendarsResult)) {
 *   for (const cal of calendarsResult.value) {
 *     console.log(cal.name);
 *   }
 * }
 *
 * // イベントを取得
 * const eventsResult = await provider.getEvents(
 *   createCalendarId('primary'),
 *   { startDate: new Date(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
 * );
 * ```
 */

import { type calendar_v3, google } from "googleapis";
import {
	apiError,
	authExpired,
	type CalendarError,
	type CalendarEvent,
	type CalendarId,
	type CalendarProvider,
	createCalendarEvent,
	createEventId,
	networkError,
	type ProviderCalendar,
	type TimeRange,
} from "@/lib/domain/calendar";
import { err, ok, type Result } from "@/lib/domain/shared";
import { type OAuthTokens, refreshToken } from "./oauth-service";
import * as tokenStore from "./token-store";

// ============================================================
// 定数
// ============================================================

/** Google OAuth クライアントID（環境変数から取得） */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

/** Google OAuth クライアントシークレット（環境変数から取得） */
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// ============================================================
// Google Calendar プロバイダ
// ============================================================

/**
 * Google Calendar プロバイダ
 *
 * Google Calendar API を使用してカレンダーとイベントを取得します。
 * トークンの自動リフレッシュ機能を持ち、期限切れの場合は
 * 自動的に新しいトークンを取得します。
 */
export class GoogleCalendarProvider implements CalendarProvider {
	/** プロバイダの種類（CalendarProvider インターフェース） */
	readonly type = "google" as const;

	/**
	 * GoogleCalendarProvider を作成
	 *
	 * @param accountEmail - Google アカウントのメールアドレス
	 * @param tokens - OAuth トークン（アクセストークン、リフレッシュトークン、有効期限）
	 */
	constructor(
		private readonly accountEmail: string,
		private tokens: OAuthTokens,
	) {}

	/**
	 * カレンダー一覧を取得
	 *
	 * アカウントに紐づくすべてのカレンダーのリストを返します。
	 * 購読カレンダーも含まれます。
	 *
	 * @returns カレンダー情報の配列、またはエラー
	 *
	 * @example
	 * ```typescript
	 * const result = await provider.getCalendars();
	 * if (isOk(result)) {
	 *   const calendars = result.value;
	 *   const primaryCalendar = calendars.find(c => c.primary);
	 * }
	 * ```
	 */
	async getCalendars(): Promise<Result<ProviderCalendar[], CalendarError>> {
		// トークンの有効性を確認し、必要に応じてリフレッシュ
		const authResult = await this.ensureValidToken();
		if (authResult._tag === "Err") {
			return authResult;
		}

		try {
			const calendar = this.createCalendarClient();
			const response = await calendar.calendarList.list();

			const calendars: ProviderCalendar[] = (response.data.items || []).map(
				(item) => ({
					id: item.id || "",
					name: item.summary || "Unknown",
					primary: item.primary || false,
					color: item.backgroundColor ?? undefined,
				}),
			);

			return ok(calendars);
		} catch (error) {
			return this.handleApiError(error);
		}
	}

	/**
	 * 指定期間のイベントを取得
	 *
	 * 指定したカレンダーの指定期間内にあるイベントを返します。
	 * 繰り返しイベントは展開された状態で返されます（singleEvents=true）。
	 *
	 * @param calendarId - 取得対象のカレンダーID（'primary' または具体的なID）
	 * @param range - 取得期間（開始日時と終了日時）
	 * @returns イベントの配列、またはエラー
	 *
	 * @example
	 * ```typescript
	 * const todayRange = getTodayRange();
	 * const result = await provider.getEvents(
	 *   createCalendarId('primary'),
	 *   createTimeRange(todayRange.startDate, todayRange.endDate)
	 * );
	 * ```
	 */
	async getEvents(
		calendarId: CalendarId,
		range: TimeRange,
	): Promise<Result<CalendarEvent[], CalendarError>> {
		// トークンの有効性を確認し、必要に応じてリフレッシュ
		const authResult = await this.ensureValidToken();
		if (authResult._tag === "Err") {
			return authResult;
		}

		try {
			const calendar = this.createCalendarClient();
			const response = await calendar.events.list({
				calendarId: calendarId as string,
				timeMin: range.start.toISOString(),
				timeMax: range.end.toISOString(),
				singleEvents: true,
				orderBy: "startTime",
			});

			const events = (response.data.items || []).map((item) =>
				this.convertToCalendarEvent(item, calendarId),
			);

			return ok(events);
		} catch (error) {
			return this.handleApiError(error);
		}
	}

	// ============================================================
	// 内部メソッド
	// ============================================================

	/**
	 * Google Calendar API クライアントを作成
	 *
	 * 現在のトークンを使用して認証済みのクライアントを返します。
	 *
	 * @returns 認証済みの Calendar API クライアント
	 */
	private createCalendarClient(): calendar_v3.Calendar {
		const oauth2Client = new google.auth.OAuth2(
			GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET,
		);
		oauth2Client.setCredentials({
			access_token: this.tokens.accessToken,
			refresh_token: this.tokens.refreshToken,
		});
		return google.calendar({ version: "v3", auth: oauth2Client });
	}

	/**
	 * トークンが有効かどうかを確認し、必要に応じてリフレッシュ
	 *
	 * トークンの有効期限が近い場合（5分以内）は自動的にリフレッシュを行い、
	 * 新しいトークンを Keychain に保存します。
	 *
	 * @returns 成功時は Ok(void)、失敗時は Err(CalendarError)
	 */
	private async ensureValidToken(): Promise<Result<void, CalendarError>> {
		// トークンが有効ならそのまま返す
		if (!tokenStore.isTokenExpired(this.tokens)) {
			return ok(undefined);
		}

		// トークンをリフレッシュ
		const refreshResult = await refreshToken(this.tokens.refreshToken);
		if (refreshResult._tag === "Err") {
			return err(
				authExpired(this.accountEmail, "トークンの更新に失敗しました"),
			);
		}

		// 新しいトークンを保存
		this.tokens = refreshResult.value;
		const saveResult = await tokenStore.saveTokens(
			this.accountEmail,
			this.tokens,
		);

		// 保存に失敗してもAPI呼び出しは可能なので、ここではエラーを無視
		// ただしログ出力などの対応は検討の余地あり
		if (saveResult._tag === "Err") {
			console.warn(
				`トークンの保存に失敗しました: ${this.accountEmail}`,
				saveResult.error,
			);
		}

		return ok(undefined);
	}

	/**
	 * Google Calendar API のイベントを CalendarEvent エンティティに変換
	 *
	 * 終日イベントと時刻指定イベントの両方に対応しています。
	 *
	 * @param item - Google Calendar API から取得したイベントデータ
	 * @param calendarId - イベントが所属するカレンダーのID
	 * @returns CalendarEvent エンティティ
	 */
	private convertToCalendarEvent(
		item: calendar_v3.Schema$Event,
		calendarId: CalendarId,
	): CalendarEvent {
		// 終日イベントかどうかを判定
		// 終日イベントの場合は dateTime ではなく date が設定される
		const isAllDay = !item.start?.dateTime;

		// 開始・終了時刻を取得
		const startTime = isAllDay
			? new Date(item.start?.date || "")
			: new Date(item.start?.dateTime || "");
		const endTime = isAllDay
			? new Date(item.end?.date || "")
			: new Date(item.end?.dateTime || "");

		return createCalendarEvent({
			id: createEventId(item.id || ""),
			calendarId,
			title: item.summary || "(タイトルなし)",
			startTime,
			endTime,
			isAllDay,
			location: item.location ?? undefined,
			description: item.description ?? undefined,
			source: {
				type: "google",
				calendarName: "", // カレンダー名は別途設定が必要
				accountEmail: this.accountEmail,
			},
		});
	}

	/**
	 * Google Calendar API エラーをハンドリング
	 *
	 * HTTP ステータスコードに応じて適切な CalendarError を生成します。
	 *
	 * @param error - 発生したエラー
	 * @returns Err(CalendarError)
	 */
	private handleApiError(error: unknown): Result<never, CalendarError> {
		// googleapis のエラーオブジェクトには code プロパティがある場合がある
		if (error instanceof Error && "code" in error) {
			const code = (error as Error & { code?: number }).code;

			// 認証エラー（401: Unauthorized, 403: Forbidden）
			if (code === 401 || code === 403) {
				return err(authExpired(this.accountEmail, "認証が必要です"));
			}

			// その他の API エラー
			return err(apiError(error.message, code || 500));
		}

		// ネットワークエラーやその他の例外
		return err(networkError("API呼び出しに失敗しました", error));
	}
}
