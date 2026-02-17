import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
    let entry: MediumWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // ヘッダー
            HStack {
                Text("今日の予定")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                Spacer()
                if entry.remainingCount > 0 {
                    Text("他\(entry.remainingCount)件")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.bottom, 2)

            if entry.events.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    Text("予定はありません")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                }
                Spacer()
            } else {
                ForEach(entry.events) { event in
                    HStack(spacing: 8) {
                        // カレンダー色バー
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Color(hex: event.calendarColor))
                            .frame(width: 3, height: 28)

                        VStack(alignment: .leading, spacing: 1) {
                            Text(event.title)
                                .font(.caption)
                                .fontWeight(.medium)
                                .lineLimit(1)
                            Text(event.isAllDay ? "終日" : event.formattedTimeRange)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }

                        Spacer()
                    }
                }
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct MiipaMediumWidget: Widget {
    let kind = "MiipaMediumWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MediumWidgetProvider()) { entry in
            MediumWidgetView(entry: entry)
        }
        .configurationDisplayName("今日の予定")
        .description("今日の予定リストを表示します")
        .supportedFamilies([.systemMedium])
    }
}
