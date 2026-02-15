import Foundation
import WatchConnectivity

/// WCSession経由で受信したイベントデータを管理
final class WatchDataStore: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = WatchDataStore()

    @Published var events: [CalendarEvent] = []
    @Published var lastUpdated: Date?

    private let storageKey = "watchEventData"

    override private init() {
        super.init()
        loadFromStorage()
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
        // 接続完了
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        if let type = message["type"] as? String, type == "updateEvents",
           let dataString = message["data"] as? String,
           let data = dataString.data(using: .utf8) {
            do {
                let watchData = try JSONDecoder().decode(WatchEventData.self, from: data)
                DispatchQueue.main.async {
                    self.events = watchData.events.sorted { $0.startDate < $1.startDate }
                    self.lastUpdated = ISO8601DateFormatter().date(from: watchData.lastUpdated)
                    self.saveToStorage(dataString)
                }
                replyHandler(["status": "ok"])
            } catch {
                replyHandler(["status": "error", "message": error.localizedDescription])
            }
        }
    }

    // MARK: - Storage

    private func saveToStorage(_ jsonString: String) {
        UserDefaults.standard.set(jsonString, forKey: storageKey)
    }

    private func loadFromStorage() {
        guard let jsonString = UserDefaults.standard.string(forKey: storageKey),
              let data = jsonString.data(using: .utf8),
              let watchData = try? JSONDecoder().decode(WatchEventData.self, from: data)
        else { return }

        events = watchData.events.sorted { $0.startDate < $1.startDate }
        lastUpdated = ISO8601DateFormatter().date(from: watchData.lastUpdated)
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
