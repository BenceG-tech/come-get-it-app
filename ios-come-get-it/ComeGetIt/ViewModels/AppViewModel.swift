import Foundation
import Observation

@Observable
@MainActor
final class AppViewModel {
    var venues: [Venue] = []
    var rewards: [Reward] = []
    var favouriteVenueIds: Set<String> = []
    var selectedFilters: Set<String> = []
    var selectedTab: AppTab = .home
    var isLoadingVenues: Bool = false
    var isLoadingRewards: Bool = false
    var venueErrorMessage: String?
    var rewardErrorMessage: String?
    var points: Int = 1260

    private let apiService: ComeGetItAPIService
    private let favouritesKey = "come-get-it.favouriteVenueIds"

    init(apiService: ComeGetItAPIService? = nil) {
        self.apiService = apiService ?? ComeGetItAPIService(
            supabaseURL: Config.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: Config.EXPO_PUBLIC_SUPABASE_ANON_KEY
        )
        loadSavedFavourites()
    }

    var filteredVenues: [Venue] {
        venues.filter { venue in
            if selectedFilters.isEmpty { return true }
            if selectedFilters.contains("ingyen-ital") {
                return venue.tags.joined(separator: " ").localizedStandardContains("ital") || venue.tags.joined(separator: " ").localizedStandardContains("drink")
            }
            return true
        }
    }

    var favouriteVenues: [Venue] {
        venues.filter { favouriteVenueIds.contains($0.id) }
    }

    func loadInitialData() async {
        await loadVenues()
        await loadRewards()
    }

    func loadVenues() async {
        isLoadingVenues = true
        venueErrorMessage = nil
        do {
            let fetched = try await apiService.fetchVenues()
            venues = fetched.isEmpty ? SampleData.venues : fetched
        } catch {
            venues = SampleData.venues
            venueErrorMessage = "Élő adat most nem elérhető, minta helyeket mutatunk."
        }
        isLoadingVenues = false
    }

    func loadRewards() async {
        isLoadingRewards = true
        rewardErrorMessage = nil
        do {
            let fetched = try await apiService.fetchRewards()
            rewards = fetched.isEmpty ? SampleData.rewards : fetched
        } catch {
            rewards = SampleData.rewards
            rewardErrorMessage = "Élő jutalmak most nem elérhetők, minta jutalmakat mutatunk."
        }
        isLoadingRewards = false
    }

    func details(for id: String) async -> VenueDetails? {
        if let remote = try? await apiService.fetchVenueDetails(id: id) {
            return remote
        }
        guard let venue = venues.first(where: { $0.id == id }) ?? SampleData.venues.first(where: { $0.id == id }) else {
            return nil
        }
        return SampleData.details(for: venue)
    }

    func isFavourite(_ venueId: String) -> Bool {
        favouriteVenueIds.contains(venueId)
    }

    func toggleFavourite(_ venue: Venue) {
        if favouriteVenueIds.contains(venue.id) {
            favouriteVenueIds.remove(venue.id)
        } else {
            favouriteVenueIds.insert(venue.id)
        }
        saveFavourites()
    }

    func toggleFilter(_ filter: String) {
        if selectedFilters.contains(filter) {
            selectedFilters.remove(filter)
        } else {
            selectedFilters.insert(filter)
        }
    }

    private func loadSavedFavourites() {
        let ids = UserDefaults.standard.stringArray(forKey: favouritesKey) ?? []
        favouriteVenueIds = Set(ids)
    }

    private func saveFavourites() {
        UserDefaults.standard.set(Array(favouriteVenueIds), forKey: favouritesKey)
    }
}

enum AppTab: String, CaseIterable, Identifiable, Sendable {
    case home
    case rewards
    case profile

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: "Helyek"
        case .rewards: "Jutalmak"
        case .profile: "Profil"
        }
    }

    var systemImage: String {
        switch self {
        case .home: "sparkles"
        case .rewards: "gift.fill"
        case .profile: "person.fill"
        }
    }
}
