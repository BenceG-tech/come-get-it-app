import CoreLocation
import Foundation

final class GeocodingService {
    private let geocoder = CLGeocoder()

    func coordinate(for venue: Venue) async -> CLLocationCoordinate2D? {
        if let latitude = venue.effectiveLatitude, let longitude = venue.effectiveLongitude, venue.hasCoordinate {
            return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        }

        let query = "\(venue.name), \(venue.address), Hungary"
        do {
            let placemarks = try await geocoder.geocodeAddressString(query)
            return placemarks.first?.location?.coordinate
        } catch {
            return nil
        }
    }
}
