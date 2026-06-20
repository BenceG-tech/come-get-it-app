import Foundation

nonisolated enum SampleData {
    static let venues: [Venue] = [
        Venue(
            id: "sample-doblo",
            name: "Doblo Wine Bar",
            address: "1072 Budapest, Dob utca 20.",
            description: "Hangulatos borbár a zsidó negyedben, magyar borokkal, kis tányérokkal és esti pezsgéssel.",
            phoneNumber: "+36 1 411 0907",
            websiteURL: "https://doblo.hu",
            imageURL: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&w=1400&q=80",
            heroImageURL: nil,
            plan: "premium",
            participatesInPoints: true,
            pointsPerVisit: 120,
            distance: 400,
            tags: ["Bor", "Date night", "Belváros"],
            latitude: 47.4984,
            longitude: 19.0612
        ),
        Venue(
            id: "sample-boutiq",
            name: "Boutiq Bar",
            address: "1061 Budapest, Paulay Ede utca 5.",
            description: "Díjnyertes koktélbár kreatív italokkal, prémium hangulattal és késő esti energiával.",
            phoneNumber: "+36 30 554 2323",
            websiteURL: "https://boutiqbar.hu",
            imageURL: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1400&q=80",
            heroImageURL: nil,
            plan: "premium",
            participatesInPoints: true,
            pointsPerVisit: 150,
            distance: 600,
            tags: ["Koktél", "Premium", "Nyitva"],
            latitude: 47.4998,
            longitude: 19.0588
        ),
        Venue(
            id: "sample-eleszto",
            name: "Élesztő Craft Beer Garden",
            address: "1094 Budapest, Tűzoltó utca 22.",
            description: "Tágas kézműves sörkert egy régi gyárépületben, magyar csapolt sörökkel és laza társasági térrel.",
            phoneNumber: nil,
            websiteURL: "https://elesztohaz.hu",
            imageURL: "https://images.unsplash.com/photo-1555658636-6e4a36218be7?auto=format&fit=crop&w=1400&q=80",
            heroImageURL: nil,
            plan: "standard",
            participatesInPoints: true,
            pointsPerVisit: 90,
            distance: 1200,
            tags: ["Craft beer", "Csoport", "Ingyen ital"],
            latitude: 47.4827,
            longitude: 19.0758
        )
    ]

    static let rewards: [Reward] = [
        Reward(
            id: "reward-spritz",
            venueId: nil,
            name: "Ingyen Spritz a következő estéden",
            description: "Váltsd be partnerhelyeinken a pénteki induláshoz.",
            pointsRequired: 800,
            validUntil: "2026-12-31",
            imageURL: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80",
            category: "drink",
            isGlobal: true,
            partnerName: "Come Get It",
            priority: 10
        ),
        Reward(
            id: "reward-food",
            venueId: nil,
            name: "2 000 Ft kedvezmény vacsorára",
            description: "Gyűjts pontot, majd csökkentsd a számlát.",
            pointsRequired: 1400,
            validUntil: "2026-12-31",
            imageURL: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
            category: "food",
            isGlobal: true,
            partnerName: "Partner éttermek",
            priority: 8
        ),
        Reward(
            id: "reward-vip",
            venueId: nil,
            name: "VIP belépő egy exkluzív estére",
            description: "Limitált élmény a legtöbb pontot gyűjtőknek.",
            pointsRequired: 2500,
            validUntil: "2026-12-31",
            imageURL: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80",
            category: "experience",
            isGlobal: true,
            partnerName: "Come Get It Events",
            priority: 5
        )
    ]

    static func details(for venue: Venue) -> VenueDetails {
        let drink = VenueDrink(
            id: "drink-\(venue.id)",
            venueId: venue.id,
            drinkName: venue.tags.contains("Craft beer") ? "Ajándék craft sör" : "Ajándék koktél",
            imageURL: venue.imageURL,
            isFreeDrink: true,
            isCover: true
        )
        let window = FreeDrinkWindow(
            id: "window-\(venue.id)",
            venueId: venue.id,
            drinkId: drink.id,
            days: [4, 5, 6],
            dayOfWeek: nil,
            start: "18:00",
            end: "21:00"
        )
        return VenueDetails(venue: venue, images: [venue.imageURL].compactMap { $0 }, drinks: [drink], freeDrinkWindows: [window])
    }
}
