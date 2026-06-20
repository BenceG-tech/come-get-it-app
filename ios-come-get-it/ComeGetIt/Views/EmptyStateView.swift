import SwiftUI

struct EmptyStateView: View {
    let systemImage: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(ComeGetItTheme.cyan)
                .frame(width: 74, height: 74)
                .background(ComeGetItTheme.cyan.opacity(0.15), in: Circle())
            Text(title)
                .font(.title3.weight(.900))
                .foregroundStyle(ComeGetItTheme.text)
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(ComeGetItTheme.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 22))
        .overlay(.rect(cornerRadius: 22).stroke(ComeGetItTheme.border, lineWidth: 1))
    }
}
