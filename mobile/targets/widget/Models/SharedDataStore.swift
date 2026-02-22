import Foundation

/// App Groups UserDefaultsからWidgetデータを読み取る
final class SharedDataStore {
    static let shared = SharedDataStore()

    private let appGroupId = "group.app.miipa.shared"
    private let dataKey = "widgetData"

    private init() {}

    /// Widgetデータを取得
    func getWidgetData() -> WidgetData? {
        #if DEBUG
        print("[Widget] getWidgetData called")
        #endif

        guard let defaults = UserDefaults(suiteName: appGroupId) else {
            #if DEBUG
            print("[Widget] UserDefaults(suiteName: \(appGroupId)) returned nil")
            #endif
            return nil
        }

        guard let jsonString = defaults.string(forKey: dataKey) else {
            #if DEBUG
            print("[Widget] No data found for key: \(dataKey)")
            #endif
            return nil
        }

        guard let data = jsonString.data(using: .utf8) else {
            #if DEBUG
            print("[Widget] Failed to convert jsonString to UTF-8 data")
            #endif
            return nil
        }

        do {
            let decoded = try JSONDecoder().decode(WidgetData.self, from: data)
            #if DEBUG
            print("[Widget] Decoded \(decoded.events.count) events, lastUpdated: \(decoded.lastUpdated)")
            #endif
            return decoded
        } catch {
            #if DEBUG
            print("[Widget] WidgetData decode error: \(error)")
            #endif
            return nil
        }
    }

    /// 今日のイベントを取得
    func getTodayEvents() -> [CalendarEvent] {
        guard let widgetData = getWidgetData() else { return [] }

        let calendar = Calendar.current
        let today = Date()

        #if DEBUG
        print("[Widget] getTodayEvents: フィルタ前 \(widgetData.events.count) 件")
        #endif
        let filtered = widgetData.events.filter { event in
            calendar.isDate(event.startDate, inSameDayAs: today)
        }.sorted { $0.startDate < $1.startDate }
        #if DEBUG
        print("[Widget] getTodayEvents: フィルタ後 \(filtered.count) 件")
        #endif

        return filtered
    }

    /// 今後N日間のイベントを時系列順で取得
    func getUpcomingEvents(days: Int = 3) -> [CalendarEvent] {
        guard let widgetData = getWidgetData() else { return [] }
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        guard let windowEnd = calendar.date(byAdding: .day, value: days, to: today) else { return [] }

        #if DEBUG
        print("[Widget] getUpcomingEvents(days: \(days)): フィルタ前 \(widgetData.events.count) 件")
        #endif
        let filtered = widgetData.events.filter { event in
            // イベントがウィンドウ [today, windowEnd) と重なるか判定
            event.endDate > today && event.startDate < windowEnd
        }.sorted { $0.startDate < $1.startDate }
        #if DEBUG
        print("[Widget] getUpcomingEvents(days: \(days)): フィルタ後 \(filtered.count) 件")
        #endif

        return filtered
    }

    /// 次のイベントを取得
    func getNextEvent() -> CalendarEvent? {
        let now = Date()
        let todayEvents = getTodayEvents()

        // まだ終わっていないイベントの中で最も早いもの
        let next = todayEvents.first { $0.endDate > now }
        #if DEBUG
        if let next = next {
            print("[Widget] getNextEvent: \(next.title) (\(next.startDate) - \(next.endDate))")
        } else {
            print("[Widget] getNextEvent: 次のイベントなし")
        }
        #endif
        return next
    }
}
