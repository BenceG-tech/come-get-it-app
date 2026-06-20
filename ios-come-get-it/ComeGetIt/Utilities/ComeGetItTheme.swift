import SwiftUI

/// Shared visual tokens for the Come Get It native app.
@MainActor
enum ComeGetItTheme {
    static let background = Color.black
    static let elevated = Color(red: 0.055, green: 0.055, blue: 0.065)
    static let card = Color(red: 0.075, green: 0.10, blue: 0.095)
    static let cyan = Color(red: 0.0, green: 0.82, blue: 1.0)
    static let cyanDeep = Color(red: 0.03, green: 0.35, blue: 0.42)
    static let text = Color.white
    static let textSecondary = Color.white.opacity(0.66)
    static let border = Color.white.opacity(0.10)
    static let logoURL = URL(string: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/orb6kvp9n7wts6gddeitn")
    static let fallbackVenueImageURL = URL(string: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200")

    static var heroGradient: LinearGradient {
        LinearGradient(
            colors: [Color(red: 0.02, green: 0.12, blue: 0.15), Color.black],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}
