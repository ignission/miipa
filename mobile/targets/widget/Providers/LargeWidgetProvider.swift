import WidgetKit
import SwiftUI

struct LargeWidgetEntry: TimelineEntry {
    let date: Date
    let events: [CalendarEvent]
}

struct LargeWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> LargeWidgetEntry {
        LargeWidgetEntry(date: Date(), events: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (LargeWidgetEntry) -> Void) {
        let todayEvents = SharedDataStore.shared.getTodayEvents()
        completion(LargeWidgetEntry(date: Date(), events: todayEvents))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LargeWidgetEntry>) -> Void) {
        let todayEvents = SharedDataStore.shared.getTodayEvents()
        let entry = LargeWidgetEntry(date: Date(), events: todayEvents)

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
