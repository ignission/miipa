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
                    // Calendar.component は Int を返すため、明示的に Double へ変換してから演算する
                    let currentHour: Double = Double(Calendar.current.component(.hour, from: entry.date))
                    let currentMinute: Double = Double(Calendar.current.component(.minute, from: entry.date))
                    let now: Double = currentHour + currentMinute / 60.0
                    let dayStart: Double = Double(dayStartHour)
                    let dayEnd: Double = Double(dayEndHour)
                    if now >= dayStart && now <= dayEnd {
                        HStack(spacing: 2) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 5, height: 5)
                            Rectangle()
                                .fill(Color.red)
                                .frame(height: 1)
                        }
                        .offset(x: 22, y: CGFloat(now - dayStart) * hourHeight)
                    }

                    // イベント
                    // 各時刻を明示的に Double へ変換し、Int との混在演算を防止する
                    let timeEvents = entry.events.filter { !$0.isAllDay }
                    ForEach(timeEvents) { event in
                        let startHour: Double = Double(Calendar.current.component(.hour, from: event.startDate))
                            + Double(Calendar.current.component(.minute, from: event.startDate)) / 60.0
                        let rawEndHour: Double = Double(Calendar.current.component(.hour, from: event.endDate))
                            + Double(Calendar.current.component(.minute, from: event.endDate)) / 60.0
                        // 深夜跨ぎイベント（例: 23:00→翌01:00）の場合、終了時刻を表示範囲終端に切り詰める
                        let endHour: Double = rawEndHour < startHour ? dayEnd : rawEndHour

                        // 表示範囲外のイベントをスキップ（phantomブロック防止）
                        if endHour > dayStart && startHour < dayEnd {
                        let clampedStart: Double = max(startHour, dayStart)
                        let clampedEnd: Double = min(endHour, dayEnd)
                        let top: CGFloat = CGFloat(clampedStart - dayStart) * hourHeight
                        let height: CGFloat = max(CGFloat(clampedEnd - clampedStart) * hourHeight, 14)

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
