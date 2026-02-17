import SwiftUI
import WidgetKit

/// accessoryRectangular: タイトル + 時刻（2行）
struct RectangularComplicationView: View {
    let nextEvent: CalendarEvent?

    var body: some View {
        if let event = nextEvent {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color(hex: event.calendarColor))
                        .frame(width: 5, height: 5)
                    Text(event.isAllDay ? "終日" : event.formattedTimeRange)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                Text(event.title)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                if let location = event.location {
                    Text("📍 \(location)")
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 2) {
                Text("miipa")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                Text("予定なし")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }
}
