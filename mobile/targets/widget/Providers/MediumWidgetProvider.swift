import WidgetKit
import SwiftUI

struct MediumWidgetEntry: TimelineEntry {
    let date: Date
    let events: [CalendarEvent]
    let remainingCount: Int
}

struct MediumWidgetProvider: TimelineProvider {
    private let maxDisplayCount = 4

    func placeholder(in context: Context) -> MediumWidgetEntry {
        MediumWidgetEntry(date: Date(), events: [], remainingCount: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (MediumWidgetEntry) -> Void) {
        let todayEvents = SharedDataStore.shared.getTodayEvents()
        let displayEvents = Array(todayEvents.prefix(maxDisplayCount))
        let remaining = max(0, todayEvents.count - maxDisplayCount)

        completion(MediumWidgetEntry(date: Date(), events: displayEvents, remainingCount: remaining))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MediumWidgetEntry>) -> Void) {
        let todayEvents = SharedDataStore.shared.getTodayEvents()
        let displayEvents = Array(todayEvents.prefix(maxDisplayCount))
        let remaining = max(0, todayEvents.count - maxDisplayCount)

        let entry = MediumWidgetEntry(date: Date(), events: displayEvents, remainingCount: remaining)

        // 次のイベント変更タイミングで更新
        let now = Date()
        let nextUpdateDate = todayEvents
            .first { $0.endDate > now }
            .map { $0.endDate }
            ?? Calendar.current.date(byAdding: .hour, value: 1, to: now)
            ?? now

        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
}
