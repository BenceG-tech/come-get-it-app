import Foundation

nonisolated struct Reward: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let venueId: String?
    let name: String
    let description: String?
    let pointsRequired: Int
    let validUntil: String
    let active: Bool
    let imageURL: String?
    let category: String?
    let isGlobal: Bool?
    let partnerName: String?
    let priority: Int?
    let termsConditions: String?

    var image: URL? { URL(string: imageURL ?? "") }

    enum CodingKeys: String, CodingKey {
        case id
        case venueId = "venue_id"
        case name
        case description
        case pointsRequired = "points_required"
        case validUntil = "valid_until"
        case active
        case imageURL = "image_url"
        case category
        case isGlobal = "is_global"
        case partnerName = "partner_name"
        case priority
        case termsConditions = "terms_conditions"
    }

    init(
        id: String,
        venueId: String? = nil,
        name: String,
        description: String? = nil,
        pointsRequired: Int,
        validUntil: String,
        active: Bool = true,
        imageURL: String? = nil,
        category: String? = nil,
        isGlobal: Bool? = nil,
        partnerName: String? = nil,
        priority: Int? = nil,
        termsConditions: String? = nil
    ) {
        self.id = id
        self.venueId = venueId
        self.name = name
        self.description = description
        self.pointsRequired = pointsRequired
        self.validUntil = validUntil
        self.active = active
        self.imageURL = imageURL
        self.category = category
        self.isGlobal = isGlobal
        self.partnerName = partnerName
        self.priority = priority
        self.termsConditions = termsConditions
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = container.decodeLossyString(forKey: .id) ?? UUID().uuidString
        venueId = container.decodeLossyString(forKey: .venueId)
        name = container.decodeLossyString(forKey: .name) ?? "Jutalom"
        description = container.decodeLossyString(forKey: .description)
        pointsRequired = container.decodeLossyInt(forKey: .pointsRequired) ?? 0
        validUntil = container.decodeLossyString(forKey: .validUntil) ?? "2026-12-31"
        active = container.decodeLossyBool(forKey: .active) ?? true
        imageURL = container.decodeLossyString(forKey: .imageURL)
        category = container.decodeLossyString(forKey: .category)
        isGlobal = container.decodeLossyBool(forKey: .isGlobal)
        partnerName = container.decodeLossyString(forKey: .partnerName)
        priority = container.decodeLossyInt(forKey: .priority)
        termsConditions = container.decodeLossyString(forKey: .termsConditions)
    }
}
