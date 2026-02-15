import SwiftUI

@main
struct MiipaWatchApp: App {
    @StateObject private var dataStore = WatchDataStore.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(dataStore)
        }
    }
}
