import SwiftUI
import WidgetKit

/// accessoryInline: "10:00 A社定例" テキスト
struct InlineComplicationView: View {
    let nextEvent: CalendarEvent?

    var body: some View {
        if let event = nextEvent {
            Text("\(event.formattedStartTime) \(event.title)")
                .font(.caption)
        } else {
            Text("予定なし")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
