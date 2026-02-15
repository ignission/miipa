import Foundation

/// Apple Watch用カレンダーイベントモデル
struct CalendarEvent: Codable, Identifiable {
    let id: String
    let title: String
    let startTime: String
    let endTime: String
    let isAllDay: Bool
    let calendarColor: String
    let location: String?

    var startDate: Date {
        ISO8601DateFormatter().date(from: startTime) ?? Date()
    }

    var endDate: Date {
        ISO8601DateFormatter().date(from: endTime) ?? Date()
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

/// Watch用データ構造
struct WatchEventData: Codable {
    let events: [CalendarEvent]
    let lastUpdated: String
}
