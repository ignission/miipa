import WidgetKit
import SwiftUI

struct LargeWidgetEntry: TimelineEntry {
    let date: Date
    let events: [CalendarEvent]
    let lastUpdated: String?
    let totalEventCount: Int
}

struct LargeWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> LargeWidgetEntry {
        LargeWidgetEntry(date: Date(), events: [], lastUpdated: nil, totalEventCount: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (LargeWidgetEntry) -> Void) {
        let widgetData = SharedDataStore.shared.getWidgetData()
        let todayEvents = SharedDataStore.shared.getTodayEvents()
        completion(LargeWidgetEntry(date: Date(), events: todayEvents, lastUpdated: widgetData?.lastUpdated, totalEventCount: widgetData?.events.count ?? 0))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<LargeWidgetEntry>) -> Void) {
        let widgetData = SharedDataStore.shared.getWidgetData()
        let todayEvents = SharedDataStore.shared.getTodayEvents()
        let entry = LargeWidgetEntry(date: Date(), events: todayEvents, lastUpdated: widgetData?.lastUpdated, totalEventCount: widgetData?.events.count ?? 0)

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
