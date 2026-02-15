import SwiftUI

extension Color {
    /// HEX文字列からColorを生成
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)

        let a: UInt64 = hex.count >= 8 ? (int >> 24) & 0xFF : 255
        let r: UInt64 = (int >> 16) & 0xFF
        let g: UInt64 = (int >> 8) & 0xFF
        let b: UInt64 = int & 0xFF

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
