import Foundation

/// カレンダーイベントモデル（Codable）
struct CalendarEvent: Codable, Identifiable {
    let id: String
    let title: String
    let startTime: String
    let endTime: String
    let isAllDay: Bool
    let calendarColor: String
    let location: String?

    /// 開始日時をDateに変換
    var startDate: Date {
        ISO8601DateFormatter().date(from: startTime) ?? Date()
    }

    /// 終了日時をDateに変換
    var endDate: Date {
        ISO8601DateFormatter().date(from: endTime) ?? Date()
    }

    /// 時刻フォーマット（HH:mm）
    var formattedStartTime: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "ja_JP")
        return formatter.string(from: startDate)
    }

    /// 時刻範囲フォーマット（HH:mm - HH:mm）
    var formattedTimeRange: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        formatter.locale = Locale(identifier: "ja_JP")
        return "\(formatter.string(from: startDate)) - \(formatter.string(from: endDate))"
    }
}

/// Widget用データ構造
struct WidgetData: Codable {
    let events: [CalendarEvent]
    let lastUpdated: String
}
