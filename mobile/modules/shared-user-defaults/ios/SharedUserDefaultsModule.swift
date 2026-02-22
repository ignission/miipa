import ExpoModulesCore
import WidgetKit
import WatchConnectivity

// Expo Modules の Module クラスは NSObject を継承していないため、
// WCSessionDelegate を直接実装できない。別クラスで管理する。
class WatchSessionManager: NSObject, WCSessionDelegate {
    static let shared = WatchSessionManager()

    private var session: WCSession?

    private override init() {
        super.init()
    }

    func activate() {
        guard WCSession.isSupported() else {
            print("[WatchSessionManager] WCSession はこのデバイスでサポートされていません")
            return
        }
        let wcSession = WCSession.default
        wcSession.delegate = self
        wcSession.activate()
        session = wcSession
        print("[WatchSessionManager] WCSession activate() を呼び出しました")
    }

    func sendToWatch(key: String, value: String, suiteName: String) {
        guard WCSession.isSupported() else {
            print("[WatchSessionManager] WCSession 非サポート、送信スキップ")
            return
        }

        guard let session = session else {
            print("[WatchSessionManager] session が未初期化、送信スキップ")
            return
        }

        guard session.isPaired else {
            print("[WatchSessionManager] Watch がペアリングされていません、送信スキップ")
            return
        }

        guard session.isWatchAppInstalled else {
            print("[WatchSessionManager] Watch アプリがインストールされていません、送信スキップ")
            return
        }

        // updateApplicationContext は最新の状態のみ保持し、バックグラウンドでも配信される
        let contextKey = suiteName + ":" + key
        do {
            try session.updateApplicationContext([contextKey: value])
            print("[WatchSessionManager] applicationContext を更新しました: \(contextKey)")
        } catch {
            print("[WatchSessionManager] applicationContext の更新に失敗: \(error.localizedDescription)")
        }
    }

    // MARK: - WCSessionDelegate（必須メソッド）

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("[WatchSessionManager] activation 失敗: \(error.localizedDescription)")
        } else {
            print("[WatchSessionManager] activation 完了: state=\(activationState.rawValue)")
        }
    }

    // iOS 側では必須
    func sessionDidBecomeInactive(_ session: WCSession) {
        print("[WatchSessionManager] session が inactive になりました")
    }

    // iOS 側では必須。再 activate で新しい Watch へ切り替え対応
    func sessionDidDeactivate(_ session: WCSession) {
        print("[WatchSessionManager] session が deactivate されました。再 activate します")
        session.activate()
    }
}

public class SharedUserDefaultsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SharedUserDefaults")

        OnCreate {
            WatchSessionManager.shared.activate()
        }

        AsyncFunction("setItem") { (key: String, value: String, suiteName: String) in
            guard let defaults = UserDefaults(suiteName: suiteName) else {
                throw NSError(domain: "SharedUserDefaults", code: 1, userInfo: [
                    NSLocalizedDescriptionKey: "UserDefaults(suiteName: \(suiteName)) の初期化に失敗"
                ])
            }
            defaults.set(value, forKey: key)
            defaults.synchronize()

            // Widget にタイムライン更新を通知
            WidgetCenter.shared.reloadAllTimelines()

            // Watch へベストエフォートで送信（失敗しても setItem 自体は成功とする）
            WatchSessionManager.shared.sendToWatch(key: key, value: value, suiteName: suiteName)
        }

        AsyncFunction("getItem") { (key: String, suiteName: String) -> String? in
            return UserDefaults(suiteName: suiteName)?.string(forKey: key)
        }

        AsyncFunction("removeItem") { (key: String, suiteName: String) in
            UserDefaults(suiteName: suiteName)?.removeObject(forKey: key)
        }
    }
}
