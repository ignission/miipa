import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
    let entry: SmallWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // ヘッダー
            HStack {
                Text("miipa")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                Spacer()
            }

            Spacer()

            if let event = entry.nextEvent {
                // カレンダー色ドット + 時刻
                HStack(spacing: 4) {
                    Circle()
                        .fill(Color(hex: event.calendarColor))
                        .frame(width: 6, height: 6)
                    Text(event.isAllDay ? "終日" : event.formattedStartTime)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                // タイトル
                Text(event.title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .lineLimit(2)

                // 場所
                if let location = event.location {
                    Text(location)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            } else {
                Text("予定なし")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct MiipaSmallWidget: Widget {
    let kind = "MiipaSmallWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SmallWidgetProvider()) { entry in
            SmallWidgetView(entry: entry)
        }
        .configurationDisplayName("次の予定")
        .description("次のイベントを表示します")
        .supportedFamilies([.systemSmall])
    }
}
