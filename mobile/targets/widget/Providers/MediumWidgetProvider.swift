import WidgetKit
import SwiftUI

struct MediumWidgetEntry: TimelineEntry {
    let date: Date
    let events: [CalendarEvent]
    let totalEventCount: Int
    let lastUpdated: String?
}

struct MediumWidgetProvider: TimelineProvider {
    private let maxDisplayCount = 5

    func placeholder(in context: Context) -> MediumWidgetEntry {
        MediumWidgetEntry(date: Date(), events: [], totalEventCount: 0, lastUpdated: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (MediumWidgetEntry) -> Void) {
        let widgetData = SharedDataStore.shared.getWidgetData()
        let upcoming = SharedDataStore.shared.getUpcomingEvents(days: 3)
        let displayEvents = Array(upcoming.prefix(maxDisplayCount))
        completion(MediumWidgetEntry(date: Date(), events: displayEvents, totalEventCount: upcoming.count, lastUpdated: widgetData?.lastUpdated))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MediumWidgetEntry>) -> Void) {
        let widgetData = SharedDataStore.shared.getWidgetData()
        let upcoming = SharedDataStore.shared.getUpcomingEvents(days: 3)
        let displayEvents = Array(upcoming.prefix(maxDisplayCount))
        let entry = MediumWidgetEntry(date: Date(), events: displayEvents, totalEventCount: upcoming.count, lastUpdated: widgetData?.lastUpdated)

        // 次のイベント変更タイミングで更新（最も早い終了時刻）
        let now = Date()
        let nextUpdateDate = upcoming
            .filter { $0.endDate > now }
            .map(\.endDate)
            .min()
            ?? Calendar.current.date(byAdding: .hour, value: 1, to: now)
            ?? now

        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }
}
