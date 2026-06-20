import SwiftUI

struct VenueCardView: View {
    @Environment(AppViewModel.self) private var appModel
    let venue: Venue
    let onOpen: (Venue) -> Void

    var body: some View {
        Button {
            onOpen(venue)
        } label: {
            VStack(spacing: 0) {
                RemoteImageFillView(url: venue.displayImageURL ?? ComeGetItTheme.fallbackVenueImageURL, height: 220, fallbackSymbol: "wineglass.fill")
                    .overlay(alignment: .topLeading) {
                        StatusPillView(title: "Budapest", isActive: false, systemImage: nil)
                            .padding(12)
                    }
                    .overlay(alignment: .topTrailing) {
                        FavouriteButtonView(isFavourite: appModel.isFavourite(venue.id)) {
                            withAnimation(.spring(response: 0.32, dampingFraction: 0.72)) {
                                appModel.toggleFavourite(venue)
                            }
                        }
                        .padding(12)
                    }
                    .overlay(alignment: .bottomTrailing) {
                        Text("Ingyen Ital Elérhető")
                            .font(.caption.weight(.800))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.black.opacity(0.68), in: .capsule)
                            .overlay(Capsule().stroke(ComeGetItTheme.cyan.opacity(0.42), lineWidth: 1))
                            .padding(12)
                    }

                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(venue.name)
                            .font(.title3.weight(.800))
                            .foregroundStyle(ComeGetItTheme.text)
                            .lineLimit(1)
                        Spacer(minLength: 10)
                        HStack(spacing: 1) {
                            ForEach(0..<5, id: \.self) { _ in
                                Image(systemName: "star.fill")
                                    .font(.system(size: 12, weight: .bold))
                                    .foregroundStyle(Color(red: 1.0, green: 0.84, blue: 0.27))
                            }
                        }
                    }

                    HStack(spacing: 8) {
                        Image(systemName: "star.circle.fill")
                            .foregroundStyle(ComeGetItTheme.cyan)
                        Text("Szerezz pontokat")
                            .font(.subheadline.weight(.700))
                            .foregroundStyle(ComeGetItTheme.text)
                        Spacer()
                        Text("+\(venue.pointsPerVisit ?? 100)")
                            .font(.caption.weight(.900))
                            .foregroundStyle(ComeGetItTheme.cyan)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(ComeGetItTheme.cyanDeep.opacity(0.34), in: .rect(cornerRadius: 12))

                    if !venue.tags.isEmpty {
                        Text(venue.tags.joined(separator: " • "))
                            .font(.subheadline.weight(.600))
                            .foregroundStyle(ComeGetItTheme.textSecondary)
                            .lineLimit(1)
                    }

                    HStack(spacing: 6) {
                        Image(systemName: "clock.fill")
                            .font(.caption)
                            .foregroundStyle(ComeGetItTheme.cyan)
                        Text("Nyitva • ma 18:00-02:00")
                            .font(.caption.weight(.700))
                            .foregroundStyle(ComeGetItTheme.textSecondary)
                        Spacer()
                    }
                }
                .padding(16)
                .background(ComeGetItTheme.elevated)
            }
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
        .background(ComeGetItTheme.elevated)
        .shadow(color: .black.opacity(0.36), radius: 18, x: 0, y: 10)
    }
}
