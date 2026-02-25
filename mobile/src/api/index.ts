// アカウント
export { deleteAccount } from "./account";

// ブリーフィング
export { fetchBriefing } from "./briefing";

// カレンダー
export type { Calendar, SyncResponse } from "./calendars";
export {
	addICalCalendar,
	deleteCalendar,
	fetchCalendars,
	startGoogleAuth,
	syncCalendars,
	toggleCalendar,
} from "./calendars";

// チャット
export type { ChatMessage, StreamEvent } from "./chat";
export { fetchChatHistory, parseSSELine, sendChatMessage } from "./chat";

// クライアント
export { ApiError, apiFetch } from "./client";

// イベント
export { fetchTodayEvents, fetchWeekEvents } from "./events";

// 設定
export type {
	AISettingsResponse,
	ChatSettingsResponse,
	SendKeyType,
} from "./settings";
export {
	fetchAISettings,
	fetchChatSettings,
	updateAISettings,
	updateChatSettings,
} from "./settings";

// セットアップ
export type {
	SaveSetupSettingsResponse,
	SetupStatusResponse,
	ValidateKeyResponse,
} from "./setup";
export { fetchSetupStatus, saveSetupSettings, validateApiKey } from "./setup";
