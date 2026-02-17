import WidgetKit
import SwiftUI

struct SmallWidgetEntry: TimelineEntry {
    let date: Date
    let nextEvent: CalendarEvent?
}

struct SmallWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> SmallWidgetEntry {
        SmallWidgetEntry(
            date: Date(),
            nextEvent: CalendarEvent(
                id: "placeholder",
                title: "次のイベント",
                startTime: ISO8601DateFormatter().string(from: Date()),
                endTime: ISO8601DateFormatter().string(from: Date().addingTimeInterval(3600)),
                isAllDay: false,
                calendarColor: "#F97316",
                location: nil
            )
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SmallWidgetEntry) -> Void) {
        let entry = SmallWidgetEntry(
            date: Date(),
            nextEvent: SharedDataStore.shared.getNextEvent()
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SmallWidgetEntry>) -> Void) {
        let nextEvent = SharedDataStore.shared.getNextEvent()
        let currentDate = Date()

        var entries: [SmallWidgetEntry] = []
        entries.append(SmallWidgetEntry(date: currentDate, nextEvent: nextEvent))

        // 次のイベント終了時に更新（過去の日時にならないよう保護）
        let nextUpdateDate: Date
        if let event = nextEvent {
            let eventEnd = event.endDate
            // endDateが過去の場合は15分後にフォールバック
            nextUpdateDate = eventEnd > currentDate
                ? eventEnd
                : currentDate.addingTimeInterval(15 * 60)
        } else {
            // イベントがない場合は1時間後に更新
            nextUpdateDate = Calendar.current.date(byAdding: .hour, value: 1, to: currentDate) ?? currentDate
        }

        let timeline = Timeline(entries: entries, policy: .after(nextUpdateDate))
        completion(timeline)
    }
}
