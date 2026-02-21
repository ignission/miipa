import Foundation

/// App Groups UserDefaultsからコンプリケーションデータを読み取る
/// Widget Extensionでは WatchConnectivity は利用できないため、App Groups のみ使用
final class ComplicationDataStore {
    static let shared = ComplicationDataStore()

    private let appGroupId = "group.app.miipa.shared"
    private let dataKey = "widgetData"

    private init() {}

    /// Widgetデータを取得
    func getWidgetData() -> WatchWidgetData? {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let jsonString = defaults.string(forKey: dataKey),
              let data = jsonString.data(using: .utf8)
        else {
            return nil
        }

        return try? JSONDecoder().decode(WatchWidgetData.self, from: data)
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

    /// 次のイベントを取得
    func getNextEvent() -> CalendarEvent? {
        let now = Date()
        let todayEvents = getTodayEvents()

        // まだ終わっていないイベントの中で最も早いもの
        return todayEvents.first { $0.endDate > now }
    }
}
