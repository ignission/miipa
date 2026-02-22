import WidgetKit
import SwiftUI

struct SmallWidgetEntry: TimelineEntry {
    let date: Date
    let events: [CalendarEvent]
    let lastUpdated: String?
    let totalEventCount: Int
}

struct SmallWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> SmallWidgetEntry {
        SmallWidgetEntry(
            date: Date(),
            events: [],
            lastUpdated: nil,
            totalEventCount: 0
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SmallWidgetEntry) -> Void) {
        let widgetData = SharedDataStore.shared.getWidgetData()
        let now = Date()
        let upcoming = SharedDataStore.shared.getUpcomingEvents(days: 1)
            .filter { $0.endDate > now }
        let events = Array(upcoming.prefix(3))
        let entry = SmallWidgetEntry(
            date: now,
            events: events,
            lastUpdated: widgetData?.lastUpdated,
            totalEventCount: widgetData?.events.count ?? 0
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SmallWidgetEntry>) -> Void) {
        let widgetData = SharedDataStore.shared.getWidgetData()
        let currentDate = Date()
        let upcoming = SharedDataStore.shared.getUpcomingEvents(days: 1)
            .filter { $0.endDate > currentDate }
        let events = Array(upcoming.prefix(3))

        var entries: [SmallWidgetEntry] = []
        entries.append(SmallWidgetEntry(
            date: currentDate,
            events: events,
            lastUpdated: widgetData?.lastUpdated,
            totalEventCount: widgetData?.events.count ?? 0
        ))

        // 最初のイベント終了時に更新（過去の日時にならないよう保護）
        let nextUpdateDate: Date
        if let firstEvent = events.first {
            let eventEnd = firstEvent.endDate
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
