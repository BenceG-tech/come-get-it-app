import SwiftUI

struct StatusPillView: View {
    let title: String
    let isActive: Bool
    let systemImage: String?

    var body: some View {
        HStack(spacing: 6) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(.system(size: 12, weight: .bold))
            }
            Text(title)
                .font(.caption.weight(.800))
                .lineLimit(1)
        }
        .foregroundStyle(isActive ? Color.black : ComeGetItTheme.text)
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(isActive ? ComeGetItTheme.cyan : Color.white.opacity(0.08), in: .capsule)
        .overlay(Capsule().stroke(isActive ? ComeGetItTheme.cyan.opacity(0.6) : ComeGetItTheme.border, lineWidth: 1))
    }
}
