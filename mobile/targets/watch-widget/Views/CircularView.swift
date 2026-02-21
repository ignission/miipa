import SwiftUI
import WidgetKit

/// accessoryCircular: イベント数またはゲージ表示
struct CircularComplicationView: View {
    let eventCount: Int

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 0) {
                Text("\(eventCount)")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                Text("件")
                    .font(.system(size: 8))
                    .foregroundColor(.secondary)
            }
        }
    }
}
