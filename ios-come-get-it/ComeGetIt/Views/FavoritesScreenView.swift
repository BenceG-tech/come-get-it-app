import SwiftUI

struct FavoritesScreenView: View {
    @Environment(AppViewModel.self) private var appModel
    let onOpenVenue: (Venue) -> Void

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 22) {
                VStack(spacing: 12) {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 44, weight: .bold))
                        .foregroundStyle(ComeGetItTheme.cyan)
                        .frame(width: 96, height: 96)
                        .background(ComeGetItTheme.cyan.opacity(0.16), in: Circle())
                    Text("Kedvenc helyeim")
                        .font(.title.bold())
                        .foregroundStyle(ComeGetItTheme.text)
                    Text("\(appModel.favouriteVenues.count) mentett helyszín")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(ComeGetItTheme.textSecondary)
                }
                .padding(.top, 20)

                if appModel.favouriteVenues.isEmpty {
                    EmptyStateView(
                        systemImage: "heart",
                        title: "Még nincs kedvenc helyed",
                        subtitle: "A vendéglátóhelyek listáján vagy a részletes oldalon nyomj a szív ikonra, és ide kerülnek a mentett helyeid."
                    )
                } else {
                    LazyVStack(spacing: 16) {
                        ForEach(appModel.favouriteVenues) { venue in
                            VenueCardView(venue: venue, onOpen: onOpenVenue)
                                .clipShape(.rect(cornerRadius: 22))
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 40)
        }
        .background(ComeGetItBackgroundView())
        .navigationTitle("Kedvencek")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }
}
