import SwiftUI

extension Color {
    /// HEX文字列からColorを生成
    /// 不正な入力の場合は.grayを返す
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)

        // HEX文字列は6文字（RGB）または8文字（ARGB）のみ有効
        guard hex.count == 6 || hex.count == 8 else {
            self = .gray
            return
        }

        var int: UInt64 = 0
        guard Scanner(string: hex).scanHexInt64(&int) else {
            self = .gray
            return
        }

        let a: UInt64 = hex.count == 8 ? (int >> 24) & 0xFF : 255
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
