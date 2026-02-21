import WidgetKit
import SwiftUI

struct WatchComplicationEntry: TimelineEntry {
    let date: Date
    let nextEvent: CalendarEvent?
    let eventCount: Int
}

struct MiipaComplicationProvider: TimelineProvider {
    func placeholder(in context: Context) -> WatchComplicationEntry {
        WatchComplicationEntry(date: Date(), nextEvent: nil, eventCount: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (WatchComplicationEntry) -> Void) {
        let store = ComplicationDataStore.shared
        completion(WatchComplicationEntry(
            date: Date(),
            nextEvent: store.getNextEvent(),
            eventCount: store.getTodayEvents().count
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WatchComplicationEntry>) -> Void) {
        let store = ComplicationDataStore.shared
        let entry = WatchComplicationEntry(
            date: Date(),
            nextEvent: store.getNextEvent(),
            eventCount: store.getTodayEvents().count
        )

        // endDateが過去の場合は15分後にフォールバック
        let currentDate = Date()
        let nextUpdate = store.getNextEvent().map { event -> Date in
            let eventEnd = event.endDate
            return eventEnd > currentDate
                ? eventEnd
                : currentDate.addingTimeInterval(15 * 60)
        }
            ?? Calendar.current.date(byAdding: .hour, value: 1, to: currentDate)
            ?? currentDate

        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct MiipaWatchComplication: Widget {
    let kind = "MiipaWatchComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MiipaComplicationProvider()) { entry in
            ComplicationEntryView(entry: entry)
        }
        .configurationDisplayName("次の予定")
        .description("miipa - 次の予定を表示")
        .supportedFamilies([
            .accessoryCorner,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}
