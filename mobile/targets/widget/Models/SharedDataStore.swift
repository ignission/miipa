import Foundation

/// App Groups UserDefaultsからWidgetデータを読み取る
final class SharedDataStore {
    static let shared = SharedDataStore()

    private let appGroupId = "group.app.miipa.shared"
    private let dataKey = "widgetData"

    private init() {}

    /// Widgetデータを取得
    func getWidgetData() -> WidgetData? {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let jsonString = defaults.string(forKey: dataKey),
              let data = jsonString.data(using: .utf8)
        else {
            return nil
        }

        return try? JSONDecoder().decode(WidgetData.self, from: data)
    }

    /// 今日のイベントを取得
    func getTodayEvents() -> [CalendarEvent] {
        guard let widgetData = getWidgetData() else { return [] }

        let calendar = Calendar.current
        let today = Date()

        return widgetData.events.filter { event in
            calendar.isDate(event.startDate, inSameDayAs: today)
        }.sorted { $0.startDate < $1.startDate }
    }

    /// 今後N日間のイベントを時系列順で取得
    func getUpcomingEvents(days: Int = 3) -> [CalendarEvent] {
        guard let widgetData = getWidgetData() else { return [] }
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        guard let windowEnd = calendar.date(byAdding: .day, value: days, to: today) else { return [] }

        return widgetData.events.filter { event in
            // イベントがウィンドウ [today, windowEnd) と重なるか判定
            event.endDate > today && event.startDate < windowEnd
        }.sorted { $0.startDate < $1.startDate }
    }

    /// 次のイベントを取得
    func getNextEvent() -> CalendarEvent? {
        let now = Date()
        let todayEvents = getTodayEvents()

        // まだ終わっていないイベントの中で最も早いもの
        return todayEvents.first { $0.endDate > now }
    }
}
