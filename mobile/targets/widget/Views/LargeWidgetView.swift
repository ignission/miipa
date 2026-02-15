import SwiftUI
import WidgetKit

struct LargeWidgetView: View {
    let entry: LargeWidgetEntry

    private let hourHeight: CGFloat = 20
    private let dayStartHour = 9
    private let dayEndHour = 18

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // ヘッダー
            HStack {
                Text("タイムライン")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                Spacer()
                Text(formattedDate)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 4)

            // タイムライン
            GeometryReader { geometry in
                ZStack(alignment: .topLeading) {
                    // 時刻グリッド
                    ForEach(dayStartHour..<dayEndHour, id: \.self) { hour in
                        HStack(spacing: 4) {
                            Text(String(format: "%02d", hour))
                                .font(.system(size: 9, design: .monospaced))
                                .foregroundColor(.secondary)
                                .frame(width: 20, alignment: .trailing)

                            Rectangle()
                                .fill(Color.secondary.opacity(0.15))
                                .frame(height: 0.5)
                        }
                        .offset(y: CGFloat(hour - dayStartHour) * hourHeight)
                    }

                    // 現在時刻インジケータ
                    let now = Calendar.current.component(.hour, from: entry.date)
                        + Double(Calendar.current.component(.minute, from: entry.date)) / 60.0
                    if now >= Double(dayStartHour) && now <= Double(dayEndHour) {
                        HStack(spacing: 2) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 5, height: 5)
                            Rectangle()
                                .fill(Color.red)
                                .frame(height: 1)
                        }
                        .offset(x: 22, y: CGFloat(now - Double(dayStartHour)) * hourHeight)
                    }

                    // イベント
                    let timeEvents = entry.events.filter { !$0.isAllDay }
                    ForEach(timeEvents) { event in
                        let startHour = Double(Calendar.current.component(.hour, from: event.startDate))
                            + Double(Calendar.current.component(.minute, from: event.startDate)) / 60.0
                        let endHour = Double(Calendar.current.component(.hour, from: event.endDate))
                            + Double(Calendar.current.component(.minute, from: event.endDate)) / 60.0
                        let clampedStart = max(startHour, Double(dayStartHour))
                        let clampedEnd = min(endHour, Double(dayEndHour))
                        let top = CGFloat(clampedStart - Double(dayStartHour)) * hourHeight
                        let height = max(CGFloat(clampedEnd - clampedStart) * hourHeight, 14)

                        HStack(spacing: 3) {
                            RoundedRectangle(cornerRadius: 1)
                                .fill(Color(hex: event.calendarColor))
                                .frame(width: 2)

                            Text(event.title)
                                .font(.system(size: 9))
                                .lineLimit(1)
                        }
                        .frame(height: height)
                        .padding(.horizontal, 4)
                        .background(Color(hex: event.calendarColor).opacity(0.15))
                        .cornerRadius(3)
                        .offset(x: 26, y: top)
                        .frame(width: geometry.size.width - 30, alignment: .leading)
                    }
                }
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "M/d（E）"
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter.string(from: entry.date)
    }
}

struct MiipaLargeWidget: Widget {
    let kind = "MiipaLargeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: LargeWidgetProvider()) { entry in
            LargeWidgetView(entry: entry)
        }
        .configurationDisplayName("タイムライン")
        .description("タイムライン形式で今日の予定を表示します")
        .supportedFamilies([.systemLarge])
    }
}
