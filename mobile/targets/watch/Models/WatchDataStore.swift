import Foundation
import WatchConnectivity

/// App Groups経由で親アプリのイベントデータを読み取り、WCSessionでも受信可能
final class WatchDataStore: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = WatchDataStore()

    @Published var events: [CalendarEvent] = []
    @Published var lastUpdated: Date?

    private let appGroupId = "group.app.miipa.shared"
    private let dataKey = "widgetData"

    override private init() {
        super.init()
        loadFromAppGroup()
        setupWatchConnectivity()
    }

    // MARK: - WatchConnectivity

    private func setupWatchConnectivity() {
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        // 接続完了時にApp Groupsから最新データを再読み込み
        DispatchQueue.main.async {
            self.loadFromAppGroup()
        }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        // メッセージタイプの検証
        guard let type = message["type"] as? String, type == "updateEvents" else {
            // 未知のメッセージタイプの場合、エラーレスポンスを返す（タイムアウト防止）
            replyHandler(["error": "unsupported", "message": "未知のメッセージタイプです"])
            return
        }

        // データペイロードの検証
        guard let dataString = message["data"] as? String,
              let data = dataString.data(using: .utf8) else {
            // データが不正な場合、エラーレスポンスを返す（タイムアウト防止）
            replyHandler(["error": "invalid_data", "message": "データの形式が不正です"])
            return
        }

        do {
            let widgetData = try JSONDecoder().decode(WatchEventData.self, from: data)
            DispatchQueue.main.async {
                self.events = widgetData.events.sorted { $0.startDate < $1.startDate }
                self.lastUpdated = ISO8601DateFormatter().date(from: widgetData.lastUpdated)
                self.saveToAppGroup(dataString)
            }
            replyHandler(["status": "ok"])
        } catch {
            replyHandler(["status": "error", "message": error.localizedDescription])
        }
    }

    // MARK: - App Groups Storage

    private func saveToAppGroup(_ jsonString: String) {
        UserDefaults(suiteName: appGroupId)?.set(jsonString, forKey: dataKey)
    }

    private func loadFromAppGroup() {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let jsonString = defaults.string(forKey: dataKey),
              let data = jsonString.data(using: .utf8),
              let widgetData = try? JSONDecoder().decode(WatchEventData.self, from: data)
        else { return }

        events = widgetData.events.sorted { $0.startDate < $1.startDate }
        lastUpdated = ISO8601DateFormatter().date(from: widgetData.lastUpdated)
    }

    /// App Groupsから最新データを再読み込み（外部から呼び出し可能）
    func refresh() {
        DispatchQueue.main.async { [weak self] in
            self?.loadFromAppGroup()
        }
    }

    /// 今日のイベントを取得
    var todayEvents: [CalendarEvent] {
        let calendar = Calendar.current
        let today = Date()
        return events.filter { calendar.isDate($0.startDate, inSameDayAs: today) }
    }

    /// 次のイベントを取得
    var nextEvent: CalendarEvent? {
        let now = Date()
        return todayEvents.first { $0.endDate > now }
    }
}
