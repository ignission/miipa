import type { StreamEvent } from "./types";

/**
 * SSEストリームを行単位で処理するReadableStreamを作成する共通ユーティリティ。
 * processLine は1行を受け取り、0個以上のStreamEventを返す。
 * done イベントの二重送信を内部で防止する。
 */
export function createSSEReadableStream(
	body: ReadableStream<Uint8Array>,
	processLine: (line: string) => StreamEvent[],
): ReadableStream<StreamEvent> {
	return new ReadableStream<StreamEvent>({
		async start(controller) {
			const reader = body.getReader();
			const decoder = new TextDecoder();
			let buffer = "";
			let doneEmitted = false;

			function enqueueEvents(events: StreamEvent[]): boolean {
				for (const evt of events) {
					controller.enqueue(evt);
					if (evt.type === "done") doneEmitted = true;
					if (evt.type === "done" || evt.type === "error") {
						controller.close();
						reader.cancel();
						return true;
					}
				}
				return false;
			}

			try {
				for (;;) {
					const { done, value } = await reader.read();
					if (done) {
						// 残りのバッファを処理
						if (buffer.trim()) {
							const terminated = enqueueEvents(processLine(buffer.trim()));
							if (terminated) return;
						}
						if (!doneEmitted) {
							controller.enqueue({ type: "done" });
						}
						controller.close();
						return;
					}

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					// 最後の不完全な行をバッファに残す
					buffer = lines.pop() ?? "";

					for (const line of lines) {
						const trimmed = line.trim();
						if (!trimmed) continue;
						const terminated = enqueueEvents(processLine(trimmed));
						if (terminated) return;
					}
				}
			} catch (e) {
				controller.enqueue({
					type: "error",
					error: e instanceof Error ? e.message : "ストリーム処理エラー",
				});
				controller.close();
			}
		},
	});
}
