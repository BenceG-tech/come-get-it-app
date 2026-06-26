import SwiftUI

struct InlineNoticeView: View {
    let message: String
    let systemImage: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: systemImage)
                .foregroundStyle(ComeGetItTheme.cyan)
            Text(message)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(ComeGetItTheme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(Color.white.opacity(0.06), in: .rect(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(ComeGetItTheme.border, lineWidth: 1))
    }
}
