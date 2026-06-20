import SwiftUI

struct FeaturePlaceholderView: View {
    let title: String

    var body: some View {
        ZStack {
            ComeGetItBackgroundView()
            VStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.system(size: 40, weight: .bold))
                    .foregroundStyle(ComeGetItTheme.cyan)
                    .frame(width: 88, height: 88)
                    .background(ComeGetItTheme.cyan.opacity(0.16), in: Circle())
                Text(title)
                    .font(.title.bold())
                    .foregroundStyle(ComeGetItTheme.text)
                Text("Ez a natív iOS verzióban is elő van készítve. A fő böngészés, részletek, kedvencek, térkép, jutalmak és profil már működik.")
                    .font(.body)
                    .foregroundStyle(ComeGetItTheme.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 24)
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }

    private var icon: String {
        if title.localizedStandardContains("Keres") { return "magnifyingglass" }
        if title.localizedStandardContains("Kárty") { return "creditcard.fill" }
        if title.localizedStandardContains("Barát") { return "paperplane.fill" }
        return "sparkles"
    }
}
