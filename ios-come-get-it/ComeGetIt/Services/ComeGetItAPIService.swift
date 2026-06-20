import Foundation

nonisolated struct VenueImageRow: Codable, Sendable {
    let imageURL: String?
    let url: String?
    let isCover: Bool?

    enum CodingKeys: String, CodingKey {
        case imageURL = "image_url"
        case url
        case isCover = "is_cover"
    }
}

nonisolated struct VenueDrinkRow: Codable, Sendable {
    let id: String
    let venueId: String
    let drinkName: String
    let imageURL: String?
    let isFreeDrink: Bool?
    let isCover: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case venueId = "venue_id"
        case drinkName = "drink_name"
        case imageURL = "image_url"
        case isFreeDrink = "is_free_drink"
        case isCover = "is_cover"
    }
}

nonisolated struct FreeDrinkWindowRow: Codable, Sendable {
    let id: String
    let venueId: String
    let drinkId: String
    let dayOfWeek: Int?
    let days: [Int]?
    let startTime: String
    let endTime: String

    enum CodingKeys: String, CodingKey {
        case id
        case venueId = "venue_id"
        case drinkId = "drink_id"
        case dayOfWeek = "day_of_week"
        case days
        case startTime = "start_time"
        case endTime = "end_time"
    }
}

nonisolated enum ComeGetItAPIError: LocalizedError, Sendable {
    case missingConfiguration
    case badURL
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .missingConfiguration:
            "A konfiguráció hiányzik."
        case .badURL:
            "Érvénytelen API cím."
        case .invalidResponse:
            "Nem sikerült értelmezni a választ."
        }
    }
}

/// REST client that mirrors the Expo app's Supabase reads.
nonisolated final class ComeGetItAPIService: @unchecked Sendable {
    private let session: URLSession
    private let supabaseURL: String
    private let supabaseAnonKey: String

    init(supabaseURL: String, supabaseAnonKey: String, session: URLSession = .shared) {
        self.supabaseURL = supabaseURL
        self.supabaseAnonKey = supabaseAnonKey
        self.session = session
    }

    func fetchVenues() async throws -> [Venue] {
        let venues: [Venue] = try await request(path: "/venues?select=*&order=created_at.desc")
        var enriched: [Venue] = []

        for venue in venues {
            guard venue.imageURL == nil, venue.heroImageURL == nil, let cover = try? await fetchVenueCoverURL(venueId: venue.id) else {
                enriched.append(venue)
                continue
            }

            enriched.append(Venue(
                id: venue.id,
                name: venue.name,
                address: venue.address,
                description: venue.description,
                phoneNumber: venue.phoneNumber,
                websiteURL: venue.websiteURL,
                imageURL: cover,
                heroImageURL: venue.heroImageURL,
                plan: venue.plan,
                participatesInPoints: venue.participatesInPoints,
                pointsPerVisit: venue.pointsPerVisit,
                distance: venue.distance,
                tags: venue.tags,
                latitude: venue.latitude,
                longitude: venue.longitude,
                coordinates: venue.coordinates
            ))
        }

        return enriched.sorted { $0.name.localizedStandardCompare($1.name) == .orderedAscending }
    }

    func fetchVenueDetails(id: String) async throws -> VenueDetails? {
        let encodedId = id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id
        let venues: [Venue] = try await request(path: "/venues?id=eq.\(encodedId)&select=*")
        guard let venue = venues.first else { return nil }

        async let imageRows: [VenueImageRow] = optionalRequest(path: "/venue_images?venue_id=eq.\(encodedId)&select=*&order=is_cover.desc,created_at.asc")
        async let drinkRows: [VenueDrinkRow] = optionalRequest(path: "/venue_drinks?venue_id=eq.\(encodedId)&select=*")
        async let windowRows: [FreeDrinkWindowRow] = optionalRequest(path: "/free_drink_windows?venue_id=eq.\(encodedId)&select=*")

        let images = try await imageRows
            .compactMap { $0.imageURL ?? $0.url }
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        let drinks = try await drinkRows.map {
            VenueDrink(
                id: $0.id,
                venueId: $0.venueId,
                drinkName: $0.drinkName,
                imageURL: $0.imageURL,
                isFreeDrink: $0.isFreeDrink ?? false,
                isCover: $0.isCover ?? false
            )
        }
        let windows = try await windowRows.map {
            FreeDrinkWindow(
                id: $0.id,
                venueId: $0.venueId,
                drinkId: $0.drinkId,
                days: $0.days ?? [],
                dayOfWeek: $0.dayOfWeek,
                start: $0.startTime,
                end: $0.endTime
            )
        }

        return VenueDetails(venue: venue, images: images, drinks: drinks, freeDrinkWindows: windows)
    }

    func fetchRewards() async throws -> [Reward] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        let order = "priority.desc.nullslast,points_required.asc".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "points_required.asc"
        return try await request(path: "/rewards?select=*&active=eq.true&valid_until=gte.\(today)&order=\(order)")
    }

    private func fetchVenueCoverURL(venueId: String) async throws -> String? {
        let encodedId = venueId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? venueId
        let rows: [VenueImageRow] = try await request(path: "/venue_images?venue_id=eq.\(encodedId)&select=url,image_url,is_cover&order=is_cover.desc,created_at.asc&limit=1")
        return rows.first?.imageURL ?? rows.first?.url
    }

    private func optionalRequest<T: Decodable>(path: String) async throws -> [T] {
        do {
            return try await request(path: path)
        } catch {
            return []
        }
    }

    private func request<T: Decodable>(path: String) async throws -> T {
        guard !supabaseURL.isEmpty, !supabaseAnonKey.isEmpty else {
            throw ComeGetItAPIError.missingConfiguration
        }

        guard let base = URL(string: supabaseURL), let url = URL(string: "/rest/v1\(path)", relativeTo: base) else {
            throw ComeGetItAPIError.badURL
        }

        var request = URLRequest(url: url)
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw ComeGetItAPIError.invalidResponse
        }

        return try JSONDecoder().decode(T.self, from: data)
    }
}
