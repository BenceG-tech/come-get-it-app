import SwiftUI

struct ProfileScreenView: View {
    @Environment(AppViewModel.self) private var appModel
    let onOpenVenue: (Venue) -> Void
    let onOpenFavorites: () -> Void
    let onOpenFeature: (String) -> Void

    private let menuItems: [(String, String)] = [
        ("Látogatási előzmények", "clock.arrow.circlepath"),
        ("Kreditek és tokenek", "creditcard.fill"),
        ("Barátok meghívása", "person.badge.plus"),
        ("Hatásom", "heart.fill"),
        ("Kuponkód beváltása", "ticket.fill"),
        ("Segítség", "questionmark.circle.fill"),
        ("Fiók", "person.crop.circle.fill"),
        ("Fizetési módok", "wallet.pass.fill")
    ]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                header
                rewardsCard
                promoBanner
                favouritesSection
                menuSection
            }
            .padding(.horizontal, 16)
            .padding(.top, 20)
            .padding(.bottom, 112)
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 5) {
                Text("Szia Bence!")
                    .font(.largeTitle.weight(.black))
                    .foregroundStyle(ComeGetItTheme.text)
                Text("Kezeld a pontjaidat és kedvenceidet")
                    .font(.subheadline.weight(.600))
                    .foregroundStyle(ComeGetItTheme.textSecondary)
            }
            Spacer()
            Image(systemName: "person.fill")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(ComeGetItTheme.text)
                .frame(width: 48, height: 48)
                .background(ComeGetItTheme.elevated, in: Circle())
                .overlay(Circle().stroke(ComeGetItTheme.border, lineWidth: 1))
        }
    }

    private var rewardsCard: some View {
        Button { onOpenFeature("Rewards Missions") } label: {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Label("Rewards", systemImage: "gift.fill")
                        .font(.caption.weight(.900))
                        .foregroundStyle(.white.opacity(0.88))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(Color.white.opacity(0.10), in: .capsule)
                    Spacer()
                    Circle()
                        .fill(ComeGetItTheme.cyan)
                        .frame(width: 10, height: 10)
                }
                Text("Come Get It")
                    .font(.title.weight(.black))
                    .foregroundStyle(ComeGetItTheme.text)
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 5) {
                        Label("Pontok", systemImage: "sparkles")
                            .font(.caption.weight(.900))
                            .foregroundStyle(ComeGetItTheme.cyan)
                        Text("\(appModel.points)")
                            .font(.system(size: 46, weight: .black, design: .rounded))
                            .foregroundStyle(ComeGetItTheme.text)
                    }
                    Spacer()
                    HStack(spacing: 4) {
                        Text("Jutalmak")
                        Image(systemName: "chevron.right")
                    }
                    .font(.caption.weight(.900))
                    .foregroundStyle(Color.black)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 10)
                    .background(ComeGetItTheme.cyan, in: .capsule)
                }
            }
            .padding(20)
            .background(
                LinearGradient(colors: [Color(red: 0.02, green: 0.18, blue: 0.23), Color(red: 0.02, green: 0.09, blue: 0.11)], startPoint: .topLeading, endPoint: .bottomTrailing),
                in: .rect(cornerRadius: 26)
            )
            .overlay(.rect(cornerRadius: 26).stroke(ComeGetItTheme.cyan.opacity(0.18), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var promoBanner: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Szeretnél kevesebbet fizetni a következő vendéglátóhelynél?")
                .font(.headline.weight(.900))
                .foregroundStyle(ComeGetItTheme.text)
            Text("Hívd meg egy barátodat, és az első látogatásánál bezsebelheted a Come Get It krediteket!")
                .font(.subheadline)
                .foregroundStyle(ComeGetItTheme.textSecondary)
            Button("Barátok meghívása") { onOpenFeature("Barátok meghívása") }
                .font(.subheadline.weight(.900))
                .foregroundStyle(ComeGetItTheme.cyan)
        }
        .padding(18)
        .background(Color.white.opacity(0.06), in: .rect(cornerRadius: 22))
        .overlay(.rect(cornerRadius: 22).stroke(ComeGetItTheme.border, lineWidth: 1))
    }

    private var favouritesSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Kedvenceid")
                    .font(.headline.weight(.900))
                    .foregroundStyle(ComeGetItTheme.text)
                Spacer()
                Button("Összes megtekintése", action: onOpenFavorites)
                    .font(.caption.weight(.900))
                    .foregroundStyle(ComeGetItTheme.cyan)
            }

            if appModel.favouriteVenues.isEmpty {
                Button(action: { appModel.selectedTab = .home }) {
                    EmptyStateView(
                        systemImage: "heart",
                        title: "Még nincs kedvenc helyed",
                        subtitle: "Nyomj szívet egy vendéglátóhelynél, és itt jelenik meg."
                    )
                }
                .buttonStyle(.plain)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 14) {
                        ForEach(appModel.favouriteVenues.prefix(5)) { venue in
                            Button { onOpenVenue(venue) } label: {
                                favouriteMiniCard(venue)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .contentMargins(.horizontal, 0)
            }
        }
    }

    private func favouriteMiniCard(_ venue: Venue) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            RemoteImageFillView(url: venue.displayImageURL ?? ComeGetItTheme.fallbackVenueImageURL, height: 118, fallbackSymbol: "wineglass.fill")
            VStack(alignment: .leading, spacing: 5) {
                Text(venue.name)
                    .font(.headline.weight(.900))
                    .foregroundStyle(ComeGetItTheme.text)
                    .lineLimit(1)
                Text(venue.tags.first ?? "Vendéglátóhely")
                    .font(.caption.weight(.700))
                    .foregroundStyle(ComeGetItTheme.cyan)
                    .lineLimit(1)
                Text(venue.description ?? "Mentett hely")
                    .font(.caption)
                    .foregroundStyle(ComeGetItTheme.textSecondary)
                    .lineLimit(2)
            }
            .padding(12)
        }
        .frame(width: 210)
        .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 18))
        .clipShape(.rect(cornerRadius: 18))
        .overlay(.rect(cornerRadius: 18).stroke(ComeGetItTheme.border, lineWidth: 1))
    }

    private var menuSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Gyors elérés")
                .font(.headline.weight(.900))
                .foregroundStyle(ComeGetItTheme.text)
            VStack(spacing: 0) {
                ForEach(menuItems, id: \.0) { title, icon in
                    Button { onOpenFeature(title) } label: {
                        HStack(spacing: 14) {
                            Image(systemName: icon)
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(ComeGetItTheme.text)
                                .frame(width: 30)
                            Text(title)
                                .font(.subheadline.weight(.700))
                                .foregroundStyle(ComeGetItTheme.text)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(ComeGetItTheme.textSecondary)
                        }
                        .padding(16)
                    }
                    .buttonStyle(.plain)
                    if title != menuItems.last?.0 {
                        Divider().overlay(ComeGetItTheme.border)
                    }
                }
            }
            .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 20))
            .overlay(.rect(cornerRadius: 20).stroke(ComeGetItTheme.border, lineWidth: 1))
        }
    }
}
