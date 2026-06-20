import SwiftUI

struct FavouriteButtonView: View {
    let isFavourite: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: isFavourite ? "heart.fill" : "heart")
                .font(.system(size: 19, weight: .bold))
                .foregroundStyle(ComeGetItTheme.cyan)
                .frame(width: 44, height: 44)
                .background(Color.black.opacity(0.62), in: Circle())
                .overlay(Circle().stroke(Color.white.opacity(0.24), lineWidth: 1))
                .shadow(color: ComeGetItTheme.cyan.opacity(isFavourite ? 0.36 : 0.12), radius: 12)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(isFavourite ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez")
    }
}
