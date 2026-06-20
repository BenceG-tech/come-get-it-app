import Foundation

nonisolated struct VenueDrink: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let venueId: String
    let drinkName: String
    let imageURL: String?
    let isFreeDrink: Bool
    let isCover: Bool
}

nonisolated struct FreeDrinkWindow: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let venueId: String
    let drinkId: String
    let days: [Int]
    let dayOfWeek: Int?
    let start: String
    let end: String
}

nonisolated struct VenueDetails: Identifiable, Hashable, Sendable {
    let venue: Venue
    let images: [String]
    let drinks: [VenueDrink]
    let freeDrinkWindows: [FreeDrinkWindow]

    var id: String { venue.id }
    var galleryURLs: [URL] {
        let candidates = images + [venue.heroImageURL, venue.imageURL].compactMap { $0 }
        var seen = Set<String>()
        return candidates.compactMap { value in
            guard seen.insert(value).inserted else { return nil }
            return URL(string: value)
        }
    }

    var freeDrinks: [VenueDrink] {
        drinks.filter(\.isFreeDrink)
    }
}
