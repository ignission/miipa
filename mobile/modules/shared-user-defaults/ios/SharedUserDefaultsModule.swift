import ExpoModulesCore

public class SharedUserDefaultsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SharedUserDefaults")

        AsyncFunction("setItem") { (key: String, value: String, suiteName: String) in
            guard let defaults = UserDefaults(suiteName: suiteName) else {
                throw NSError(domain: "SharedUserDefaults", code: 1, userInfo: [
                    NSLocalizedDescriptionKey: "UserDefaults(suiteName: \(suiteName)) の初期化に失敗"
                ])
            }
            defaults.set(value, forKey: key)
        }

        AsyncFunction("getItem") { (key: String, suiteName: String) -> String? in
            return UserDefaults(suiteName: suiteName)?.string(forKey: key)
        }

        AsyncFunction("removeItem") { (key: String, suiteName: String) in
            UserDefaults(suiteName: suiteName)?.removeObject(forKey: key)
        }
    }
}
