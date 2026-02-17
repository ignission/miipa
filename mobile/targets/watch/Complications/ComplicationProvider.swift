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
        let store = WatchDataStore.shared
        completion(WatchComplicationEntry(
            date: Date(),
            nextEvent: store.nextEvent,
            eventCount: store.todayEvents.count
        ))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WatchComplicationEntry>) -> Void) {
        let store = WatchDataStore.shared
        let entry = WatchComplicationEntry(
            date: Date(),
            nextEvent: store.nextEvent,
            eventCount: store.todayEvents.count
        )

        // endDateが過去の場合は15分後にフォールバック（SmallWidgetProviderと同様の保護）
        let currentDate = Date()
        let nextUpdate = store.nextEvent.map { event -> Date in
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

/// Complicationのエントリに応じたビューを切り替えるラッパー
/// TimelineEntryにはcontextプロパティがないため、@Environment(\.widgetFamily)を使用する
struct ComplicationEntryView: View {
    let entry: WatchComplicationEntry

    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCorner:
            CornerComplicationView(nextEvent: entry.nextEvent)
        case .accessoryCircular:
            CircularComplicationView(eventCount: entry.eventCount)
        case .accessoryRectangular:
            RectangularComplicationView(nextEvent: entry.nextEvent)
        case .accessoryInline:
            InlineComplicationView(nextEvent: entry.nextEvent)
        default:
            RectangularComplicationView(nextEvent: entry.nextEvent)
        }
    }
}

struct MiipaWatchComplication: Widget {
    let kind = "MiipaWatchComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MiipaComplicationProvider()) { entry in
            ComplicationEntryView(entry: entry)
        }
        .configurationDisplayName("miipa")
        .description("次の予定を表示します")
        .supportedFamilies([
            .accessoryCorner,
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}
