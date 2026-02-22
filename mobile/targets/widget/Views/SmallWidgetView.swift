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

            if entry.events.isEmpty {
                Text("予定なし")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(entry.events, id: \.id) { event in
                    HStack(spacing: 4) {
                        Circle()
                            .fill(Color(hex: event.calendarColor))
                            .frame(width: 5, height: 5)
                        Text(event.isAllDay ? "終日" : event.formattedStartTime)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.secondary)
                        Text(event.title)
                            .font(.caption)
                            .fontWeight(.medium)
                            .lineLimit(1)
                    }
                }
            }

            Spacer()

            // デバッグフッター
            HStack {
                Spacer()
                Text(debugLabel)
                    .font(.system(size: 8))
                    .foregroundColor(.gray.opacity(0.4))
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }

    /// デバッグ用ラベル
    private var debugLabel: String {
        guard let lastUpdated = entry.lastUpdated else {
            return "データなし"
        }
        let timeStr = formatTime(from: lastUpdated)
        return "更新: \(timeStr) | 全\(entry.totalEventCount)件"
    }

    /// ISO8601文字列からHH:mm部分を抽出
    private func formatTime(from iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
        guard let date = date else { return "??" }
        let df = DateFormatter()
        df.dateFormat = "HH:mm"
        df.locale = Locale(identifier: "ja_JP")
        return df.string(from: date)
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
