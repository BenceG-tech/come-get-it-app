import SwiftUI

struct HomeScreenView: View {
    @Environment(AppViewModel.self) private var appModel
    let onOpenVenue: (Venue) -> Void
    let onOpenMap: () -> Void
    let onOpenFeature: (String) -> Void

    var body: some View {
        VStack(spacing: 0) {
            TopLogoHeaderView(
                onSearch: { onOpenFeature("Keresés") },
                onMap: onOpenMap
            )

            filterBar

            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 16) {
                    if let message = appModel.venueErrorMessage {
                        InlineNoticeView(message: message, systemImage: "wifi.slash")
                            .padding(.horizontal, 16)
                    }

                    if appModel.isLoadingVenues && appModel.venues.isEmpty {
                        ProgressView("Helyek betöltése…")
                            .tint(ComeGetItTheme.cyan)
                            .foregroundStyle(ComeGetItTheme.textSecondary)
                            .padding(.top, 40)
                    } else if appModel.filteredVenues.isEmpty {
                        EmptyStateView(
                            systemImage: "magnifyingglass",
                            title: "Nincs találat",
                            subtitle: "Próbálj meg más szűrőket vagy keresési kifejezést."
                        )
                        .padding(.horizontal, 16)
                        .padding(.top, 32)
                    } else {
                        ForEach(appModel.filteredVenues) { venue in
                            VenueCardView(venue: venue, onOpen: onOpenVenue)
                        }
                    }
                }
                .padding(.bottom, 112)
            }
            .refreshable {
                await appModel.loadVenues()
            }
        }
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                Button {
                    withAnimation(.snappy) { appModel.toggleFilter("nyitva") }
                } label: {
                    StatusPillView(title: "NYITVA", isActive: appModel.selectedFilters.contains("nyitva"), systemImage: nil)
                }
                .buttonStyle(.plain)

                Button {
                    withAnimation(.snappy) { appModel.toggleFilter("ingyen-ital") }
                } label: {
                    StatusPillView(title: "Ingyen ital elérhető", isActive: appModel.selectedFilters.contains("ingyen-ital"), systemImage: nil)
                }
                .buttonStyle(.plain)

                Button {
                    onOpenFeature("Szűrők")
                } label: {
                    StatusPillView(title: "Szűrők", isActive: false, systemImage: "line.3.horizontal.decrease")
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .contentMargins(.horizontal, 0)
    }
}
