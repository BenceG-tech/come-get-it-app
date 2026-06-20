import SwiftUI

struct ContentView: View {
    @State private var appModel: AppViewModel = AppViewModel()
    @State private var path: [AppRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            ZStack(alignment: .bottom) {
                ComeGetItBackgroundView()

                Group {
                    switch appModel.selectedTab {
                    case .home:
                        HomeScreenView(
                            onOpenVenue: { venue in path.append(.venue(venue.id)) },
                            onOpenMap: { path.append(.map) },
                            onOpenFeature: { title in path.append(.feature(title)) }
                        )
                    case .rewards:
                        RewardsScreenView { title in
                            path.append(.feature(title))
                        }
                    case .profile:
                        ProfileScreenView(
                            onOpenVenue: { venue in path.append(.venue(venue.id)) },
                            onOpenFavorites: { path.append(.favorites) },
                            onOpenFeature: { title in path.append(.feature(title)) }
                        )
                    }
                }
                .transition(.opacity.combined(with: .scale(scale: 0.98)))

                NativeTabBarView(selectedTab: Binding(
                    get: { appModel.selectedTab },
                    set: { appModel.selectedTab = $0 }
                ))
                .padding(.bottom, 6)
            }
            .environment(appModel)
            .toolbar(.hidden, for: .navigationBar)
            .task {
                await appModel.loadInitialData()
            }
            .navigationDestination(for: AppRoute.self) { route in
                switch route {
                case .venue(let id):
                    VenueDetailScreenView(venueId: id)
                        .environment(appModel)
                case .favorites:
                    FavoritesScreenView { venue in
                        path.append(.venue(venue.id))
                    }
                    .environment(appModel)
                case .map:
                    VenueMapScreenView(venues: appModel.venues) { venue in
                        path.append(.venue(venue.id))
                    }
                case .feature(let title):
                    FeaturePlaceholderView(title: title)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

#Preview {
    ContentView()
}
