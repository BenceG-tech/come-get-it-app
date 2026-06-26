import MapKit
import SwiftUI
import UIKit

struct VenueDetailScreenView: View {
    @Environment(AppViewModel.self) private var appModel
    let venueId: String

    @State private var details: VenueDetails?
    @State private var isLoading: Bool = true
    @State private var selectedImageIndex: Int = 0
    @State private var showRedeemSheet: Bool = false

    var body: some View {
        ZStack {
            ComeGetItBackgroundView()

            if isLoading {
                ProgressView("Hely betöltése…")
                    .tint(ComeGetItTheme.cyan)
                    .foregroundStyle(ComeGetItTheme.textSecondary)
            } else if let details {
                detailContent(details)
            } else {
                EmptyStateView(
                    systemImage: "exclamationmark.triangle.fill",
                    title: "Nem található a hely",
                    subtitle: "Próbáld meg újra a vendéglátóhely listából."
                )
                .padding(16)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task(id: venueId) {
            isLoading = true
            details = await appModel.details(for: venueId)
            isLoading = false
        }
        .sheet(isPresented: $showRedeemSheet) {
            redeemSheet
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
                .presentationContentInteraction(.scrolls)
        }
    }

    private func detailContent(_ details: VenueDetails) -> some View {
        let venue = details.venue
        let gallery = details.galleryURLs.isEmpty ? [venue.displayImageURL ?? ComeGetItTheme.fallbackVenueImageURL].compactMap { $0 } : details.galleryURLs

        return ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 22) {
                hero(venue: venue, gallery: gallery)

                VStack(alignment: .leading, spacing: 18) {
                    titleBlock(venue: venue)
                    quickActions(venue: venue)
                    freeDrinkSection(details: details)
                    VenueMiniMapView(venue: venue)
                    aboutSection(venue: venue)
                    openingHoursSection
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 34)
            }
        }
        .ignoresSafeArea(edges: .top)
    }

    private func hero(venue: Venue, gallery: [URL]) -> some View {
        TabView(selection: $selectedImageIndex) {
            ForEach(Array(gallery.enumerated()), id: \.offset) { index, url in
                RemoteImageFillView(url: url, height: 390, fallbackSymbol: "wineglass.fill")
                    .tag(index)
            }
        }
        .tabViewStyle(.page(indexDisplayMode: gallery.count > 1 ? .automatic : .never))
        .frame(height: 390)
        .overlay(alignment: .bottomLeading) {
            LinearGradient(colors: [.clear, .black.opacity(0.88)], startPoint: .top, endPoint: .bottom)
                .frame(height: 190)
        }
        .overlay(alignment: .bottomLeading) {
            VStack(alignment: .leading, spacing: 10) {
                StatusPillView(title: "Budapest", isActive: false, systemImage: "mappin")
                Text(venue.name)
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundStyle(ComeGetItTheme.text)
                    .lineLimit(2)
                if !venue.tags.isEmpty {
                    Text(venue.tags.prefix(4).joined(separator: " • "))
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(ComeGetItTheme.textSecondary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .overlay(alignment: .topTrailing) {
            FavouriteButtonView(isFavourite: appModel.isFavourite(venue.id)) {
                withAnimation(.spring(response: 0.32, dampingFraction: 0.72)) {
                    appModel.toggleFavourite(venue)
                }
            }
            .padding(.top, 56)
            .padding(.trailing, 16)
        }
    }

    private func titleBlock(venue: Venue) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                ForEach(0..<5, id: \.self) { _ in
                    Image(systemName: "star.fill")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color(red: 1.0, green: 0.84, blue: 0.27))
                }
                Text("5.0")
                    .font(.subheadline.weight(.heavy))
                    .foregroundStyle(ComeGetItTheme.textSecondary)
            }

            Label(venue.address, systemImage: "mappin.and.ellipse")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(ComeGetItTheme.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func quickActions(venue: Venue) -> some View {
        HStack(spacing: 12) {
            Button { showRedeemSheet = true } label: {
                Label("Ingyen ital", systemImage: "qrcode")
                    .font(.subheadline.weight(.black))
                    .foregroundStyle(Color.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(ComeGetItTheme.cyan, in: .capsule)
            }
            .buttonStyle(.plain)

            Button { openInMaps(venue) } label: {
                Image(systemName: "location.fill")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(ComeGetItTheme.text)
                    .frame(width: 52, height: 52)
                    .comeGetItGlass(in: Circle())
            }
            .buttonStyle(.plain)
        }
    }

    private func freeDrinkSection(details: VenueDetails) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Elérhető ajánlatok")
                .font(.headline.weight(.black))
                .foregroundStyle(ComeGetItTheme.text)

            if details.freeDrinks.isEmpty {
                InlineNoticeView(message: "Jelenleg nincs külön ital megadva, de a partnerhely pontgyűjtése aktív.", systemImage: "sparkles")
            } else {
                ForEach(details.freeDrinks) { drink in
                    HStack(spacing: 12) {
                        Image(systemName: "wineglass.fill")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(ComeGetItTheme.cyan)
                            .frame(width: 52, height: 52)
                            .background(ComeGetItTheme.cyan.opacity(0.13), in: .rect(cornerRadius: 16))
                        VStack(alignment: .leading, spacing: 4) {
                            Text(drink.drinkName)
                                .font(.headline.weight(.black))
                                .foregroundStyle(ComeGetItTheme.text)
                            Text("Csütörtök–szombat • 18:00–21:00")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(ComeGetItTheme.textSecondary)
                        }
                        Spacer()
                    }
                    .padding(14)
                    .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 18))
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(ComeGetItTheme.border, lineWidth: 1))
                }
            }
        }
    }

    private func aboutSection(venue: Venue) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Részletek")
                .font(.headline.weight(.black))
                .foregroundStyle(ComeGetItTheme.text)
            Text(venue.description ?? "Partner vendéglátóhely Come Get It pontgyűjtéssel, kedvenc mentéssel és térképes útvonaltervezéssel.")
                .font(.body)
                .foregroundStyle(ComeGetItTheme.textSecondary)
                .lineSpacing(4)
        }
        .padding(16)
        .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(ComeGetItTheme.border, lineWidth: 1))
    }

    private var openingHoursSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Nyitvatartás")
                .font(.headline.weight(.black))
                .foregroundStyle(ComeGetItTheme.text)
            ForEach(["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"], id: \.self) { day in
                HStack {
                    Text(day)
                        .foregroundStyle(ComeGetItTheme.textSecondary)
                    Spacer()
                    Text(day == "Vasárnap" ? "Zárva" : "18:00 – 02:00")
                        .foregroundStyle(ComeGetItTheme.text)
                        .fontWeight(.bold)
                }
                .font(.subheadline)
            }
        }
        .padding(16)
        .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(ComeGetItTheme.border, lineWidth: 1))
    }

    private var redeemSheet: some View {
        VStack(spacing: 18) {
            Image(systemName: "qrcode")
                .font(.system(size: 64, weight: .bold))
                .foregroundStyle(ComeGetItTheme.cyan)
                .frame(width: 120, height: 120)
                .background(Color.black, in: .rect(cornerRadius: 24))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(ComeGetItTheme.cyan.opacity(0.4), lineWidth: 1))
            Text("Kupon beváltása")
                .font(.title2.bold())
            Text("A teljes QR beváltási folyamat a natív appban elő van készítve. Mutasd meg a kódot a partnerhelyen.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Kész") { showRedeemSheet = false }
                .buttonStyle(.borderedProminent)
        }
        .padding(24)
    }

    private func openInMaps(_ venue: Venue) {
        let query = venue.address.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? venue.address
        if let url = URL(string: "http://maps.apple.com/?q=\(query)") {
            UIApplication.shared.open(url)
        }
    }
}
