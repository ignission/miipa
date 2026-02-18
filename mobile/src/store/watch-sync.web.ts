import type { UICalendarEvent } from "../hooks/useEvents";

/**
 * Web環境ではApple Watch同期は利用不可のためno-op
 */
export async function syncToWatch(_events: UICalendarEvent[]): Promise<void> {
	// Web環境では何もしない
}
