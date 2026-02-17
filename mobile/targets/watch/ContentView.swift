import SwiftUI

struct ContentView: View {
    @EnvironmentObject var dataStore: WatchDataStore

    var body: some View {
        NavigationView {
            if dataStore.todayEvents.isEmpty {
                VStack(spacing: 8) {
                    Text("🐾")
                        .font(.title)
                    Text("予定なし")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
            } else {
                List(dataStore.todayEvents) { event in
                    EventRow(event: event)
                }
                .listStyle(.carousel)
                .navigationTitle("今日")
            }
        }
    }
}

struct EventRow: View {
    let event: CalendarEvent

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Circle()
                    .fill(Color(hex: event.calendarColor))
                    .frame(width: 6, height: 6)
                Text(event.isAllDay ? "終日" : event.formattedStartTime)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Text(event.title)
                .font(.caption)
                .fontWeight(.semibold)
                .lineLimit(2)

            if let location = event.location {
                Text(location)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 4)
    }
}
