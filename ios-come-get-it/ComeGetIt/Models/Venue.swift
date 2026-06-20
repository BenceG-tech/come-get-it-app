import Foundation

nonisolated struct VenueCoordinates: Codable, Hashable, Sendable {
    let lat: Double
    let lng: Double
}

nonisolated struct Venue: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let name: String
    let address: String
    let description: String?
    let phoneNumber: String?
    let websiteURL: String?
    let imageURL: String?
    let heroImageURL: String?
    let plan: String?
    let participatesInPoints: Bool?
    let pointsPerVisit: Int?
    let distance: Double?
    let tags: [String]
    let latitude: Double?
    let longitude: Double?
    let coordinates: VenueCoordinates?

    var displayImageURL: URL? {
        URL(string: heroImageURL ?? imageURL ?? "") ?? URL(string: imageURL ?? "")
    }

    var effectiveLatitude: Double? {
        coordinates?.lat ?? latitude
    }

    var effectiveLongitude: Double? {
        coordinates?.lng ?? longitude
    }

    var hasCoordinate: Bool {
        guard let effectiveLatitude, let effectiveLongitude else { return false }
        return effectiveLatitude.isFinite && effectiveLongitude.isFinite && !(effectiveLatitude == 0 && effectiveLongitude == 0)
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case address
        case description
        case phoneNumber = "phone_number"
        case websiteURL = "website_url"
        case imageURL = "image_url"
        case heroImageURL = "hero_image_url"
        case plan
        case participatesInPoints = "participates_in_points"
        case pointsPerVisit = "points_per_visit"
        case distance
        case tags
        case latitude
        case longitude
        case coordinates
    }

    init(
        id: String,
        name: String,
        address: String,
        description: String? = nil,
        phoneNumber: String? = nil,
        websiteURL: String? = nil,
        imageURL: String? = nil,
        heroImageURL: String? = nil,
        plan: String? = nil,
        participatesInPoints: Bool? = nil,
        pointsPerVisit: Int? = nil,
        distance: Double? = nil,
        tags: [String] = [],
        latitude: Double? = nil,
        longitude: Double? = nil,
        coordinates: VenueCoordinates? = nil
    ) {
        self.id = id
        self.name = name
        self.address = address
        self.description = description
        self.phoneNumber = phoneNumber
        self.websiteURL = websiteURL
        self.imageURL = imageURL
        self.heroImageURL = heroImageURL
        self.plan = plan
        self.participatesInPoints = participatesInPoints
        self.pointsPerVisit = pointsPerVisit
        self.distance = distance
        self.tags = tags
        self.latitude = latitude
        self.longitude = longitude
        self.coordinates = coordinates
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = container.decodeLossyString(forKey: .id) ?? UUID().uuidString
        name = container.decodeLossyString(forKey: .name) ?? "Vendéglátóhely"
        address = container.decodeLossyString(forKey: .address) ?? "Budapest"
        description = container.decodeLossyString(forKey: .description)
        phoneNumber = container.decodeLossyString(forKey: .phoneNumber)
        websiteURL = container.decodeLossyString(forKey: .websiteURL)
        imageURL = container.decodeLossyString(forKey: .imageURL)
        heroImageURL = container.decodeLossyString(forKey: .heroImageURL)
        plan = container.decodeLossyString(forKey: .plan)
        participatesInPoints = container.decodeLossyBool(forKey: .participatesInPoints)
        pointsPerVisit = container.decodeLossyInt(forKey: .pointsPerVisit)
        distance = container.decodeLossyDouble(forKey: .distance)
        tags = container.decodeLossyStringArray(forKey: .tags) ?? []
        latitude = container.decodeLossyDouble(forKey: .latitude)
        longitude = container.decodeLossyDouble(forKey: .longitude)
        coordinates = try? container.decodeIfPresent(VenueCoordinates.self, forKey: .coordinates)
    }
}
