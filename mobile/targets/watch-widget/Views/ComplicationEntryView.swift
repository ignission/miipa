import SwiftUI
import WidgetKit

/// Complicationのエントリに応じたビューを切り替えるラッパー
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
