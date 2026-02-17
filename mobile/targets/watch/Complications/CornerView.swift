import SwiftUI
import WidgetKit

/// accessoryCorner: 次のイベント時刻を表示
struct CornerComplicationView: View {
    let nextEvent: CalendarEvent?

    var body: some View {
        if let event = nextEvent {
            Text(event.formattedStartTime)
                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                .foregroundColor(.orange)
                .widgetLabel {
                    Text(event.title)
                }
        } else {
            Text("--:--")
                .font(.system(size: 12, design: .monospaced))
                .foregroundColor(.secondary)
        }
    }
}
