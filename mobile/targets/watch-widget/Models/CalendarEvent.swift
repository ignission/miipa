import Foundation

/// Apple Watch Widget用カレンダーイベントモデル
struct CalendarEvent: Codable, Identifiable {
    let id: String
    let title: String
    let startTime: String
    let endTime: String
    let isAllDay: Bool
    let calendarColor: String
    let location: String?

    /// ミリ秒付きISO8601フォーマッター
    private static let isoFormatterWithFractionalSeconds: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    /// ミリ秒なしISO8601フォーマッター（フォールバック用）
    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    /// ISO8601文字列をDateに変換（ミリ秒あり/なし両対応）
    private static func parseISO8601(_ string: String) -> Date? {
        isoFormatterWithFractionalSeconds.date(from: string)
            ?? isoFormatter.date(from: string)
    }

    var startDate: Date {
        Self.parseISO8601(startTime) ?? Date()
    }

    var endDate: Date {
        Self.parseISO8601(endTime) ?? Date()
    }

    var formattedStartTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter.string(from: startDate)
    }

    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "ja_JP")
        return "\(formatter.string(from: startDate)) - \(formatter.string(from: endDate))"
    }
}

/// Watch Widget用データ構造
struct WatchWidgetData: Codable {
    let events: [CalendarEvent]
    let lastUpdated: String
}
