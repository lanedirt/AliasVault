import SwiftUI

public struct ColorConstants {
    public struct Light {
        static let text = SwiftUI.Color(hex: "#11181C")
        static let textMuted = SwiftUI.Color(hex: "#4b5563")
        static let background = SwiftUI.Color(hex: "#ffffff")
        static let accentBackground = SwiftUI.Color(hex: "#fff")
        static let accentBorder = SwiftUI.Color(hex: "#d1d5db")
        static let primary = SwiftUI.Color(hex: "#f49541")
        static let secondary = SwiftUI.Color(hex: "#6b7280")
        static let icon = SwiftUI.Color(hex: "#687076")
    }

    public struct Dark {
        static let text = SwiftUI.Color(hex: "#ECEDEE")
        static let textMuted = SwiftUI.Color(hex: "#9BA1A6")
        static let background = SwiftUI.Color(hex: "#111827")
        static let accentBackground = SwiftUI.Color(hex: "#1f2937")
        static let accentBorder = SwiftUI.Color(hex: "#4b5563")
        static let primary = SwiftUI.Color(hex: "#f49541")
        static let secondary = SwiftUI.Color(hex: "#6b7280")
        static let icon = SwiftUI.Color(hex: "#9BA1A6")
    }
}

// Add Color extension for hex support
extension SwiftUI.Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
