import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
    let entry: MediumWidgetEntry

    /// 残り件数
    private var remainingCount: Int {
        max(0, entry.totalEventCount - entry.events.count)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            // ヘッダー
            HStack {
                Text("直近の予定")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                Spacer()
                if remainingCount > 0 {
                    Text("他\(remainingCount)件")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.bottom, 1)

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
                ForEach(Array(entry.events.enumerated()), id: \.element.id) { index, event in
                    // 日付セパレータ（日が変わった場合に表示）
                    if let separator = dateSeparator(for: event, at: index) {
                        HStack(spacing: 4) {
                            Text(separator)
                                .font(.system(size: 10))
                                .foregroundColor(.secondary)
                            VStack { Divider() }
                        }
                        .padding(.top, index == 0 ? 0 : 2)
                    }

                    // イベント行
                    HStack(spacing: 6) {
                        // カレンダー色バー
                        RoundedRectangle(cornerRadius: 1.5)
                            .fill(Color(hex: event.calendarColor))
                            .frame(width: 2.5, height: 16)

                        // 時刻
                        Text(event.isAllDay ? "終日" : event.formattedStartTime)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundColor(.secondary)
                            .frame(width: 34, alignment: .leading)

                        // タイトル
                        Text(event.title)
                            .font(.caption)
                            .fontWeight(.medium)
                            .lineLimit(1)

                        Spacer()
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }

    /// 日付セパレータのテキストを返す（不要な場合はnil）
    private func dateSeparator(for event: CalendarEvent, at index: Int) -> String? {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let eventDay = calendar.startOfDay(for: event.startDate)

        // 最初のイベントが今日なら省略
        if index == 0 {
            if calendar.isDate(eventDay, inSameDayAs: today) {
                return nil
            }
            // 最初のイベントが今日でなければセパレータ表示
            return dayLabel(for: eventDay, today: today, calendar: calendar)
        }

        // 前のイベントと日付が異なる場合にセパレータ表示
        let prevEvent = entry.events[index - 1]
        let prevDay = calendar.startOfDay(for: prevEvent.startDate)
        if !calendar.isDate(eventDay, inSameDayAs: prevDay) {
            return dayLabel(for: eventDay, today: today, calendar: calendar)
        }

        return nil
    }

    /// 日付ラベル（「明日」またはM/d（E））
    private func dayLabel(for date: Date, today: Date, calendar: Calendar) -> String {
        if let tomorrow = calendar.date(byAdding: .day, value: 1, to: today),
           calendar.isDate(date, inSameDayAs: tomorrow) {
            return "明日"
        }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.dateFormat = "M/d（E）"
        return formatter.string(from: date)
    }
}

struct MiipaMediumWidget: Widget {
    let kind = "MiipaMediumWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MediumWidgetProvider()) { entry in
            MediumWidgetView(entry: entry)
        }
        .configurationDisplayName("直近の予定")
        .description("3日間の予定を表示します")
        .supportedFamilies([.systemMedium])
    }
}
