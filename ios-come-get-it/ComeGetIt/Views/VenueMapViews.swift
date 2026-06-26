import MapKit
import SwiftUI

struct VenueMapScreenView: View {
    let venues: [Venue]
    let onOpenVenue: (Venue) -> Void
    @State private var position: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 47.4979, longitude: 19.0402),
            span: MKCoordinateSpan(latitudeDelta: 0.075, longitudeDelta: 0.075)
        )
    )

    var body: some View {
        ZStack(alignment: .bottom) {
            Map(position: $position) {
                ForEach(venues.filter(\.hasCoordinate)) { venue in
                    Marker(venue.name, systemImage: "wineglass.fill", coordinate: CLLocationCoordinate2D(
                        latitude: venue.effectiveLatitude ?? 47.4979,
                        longitude: venue.effectiveLongitude ?? 19.0402
                    ))
                    .tint(.cyan)
                }
            }
            .mapStyle(.standard(elevation: .realistic))
            .ignoresSafeArea(edges: .bottom)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(venues.prefix(12)) { venue in
                        Button { onOpenVenue(venue) } label: {
                            HStack(spacing: 10) {
                                RemoteImageFillView(url: venue.displayImageURL ?? ComeGetItTheme.fallbackVenueImageURL, height: 58, fallbackSymbol: "wineglass.fill")
                                    .frame(width: 72, height: 58)
                                    .clipShape(.rect(cornerRadius: 14))
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(venue.name)
                                        .font(.subheadline.weight(.black))
                                        .foregroundStyle(ComeGetItTheme.text)
                                        .lineLimit(1)
                                    Text(venue.address)
                                        .font(.caption)
                                        .foregroundStyle(ComeGetItTheme.textSecondary)
                                        .lineLimit(1)
                                }
                            }
                            .frame(width: 260, alignment: .leading)
                            .padding(10)
                            .background(Color.black.opacity(0.72), in: .rect(cornerRadius: 20))
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(ComeGetItTheme.border, lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 16)
            }
        }
        .navigationTitle("Térkép")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }
}

struct VenueMiniMapView: View {
    let venue: Venue
    @State private var position: MapCameraPosition

    init(venue: Venue) {
        self.venue = venue
        let coordinate = CLLocationCoordinate2D(
            latitude: venue.effectiveLatitude ?? 47.4979,
            longitude: venue.effectiveLongitude ?? 19.0402
        )
        _position = State(initialValue: .region(MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.012, longitudeDelta: 0.012)
        )))
    }

    var body: some View {
        Color.white.opacity(0.06)
            .frame(height: 190)
            .overlay {
                if venue.hasCoordinate {
                    Map(position: $position) {
                        Marker(venue.name, systemImage: "wineglass.fill", coordinate: CLLocationCoordinate2D(
                            latitude: venue.effectiveLatitude ?? 47.4979,
                            longitude: venue.effectiveLongitude ?? 19.0402
                        ))
                        .tint(.cyan)
                    }
                    .allowsHitTesting(false)
                } else {
                    ZStack {
                        ComeGetItTheme.heroGradient
                        VStack(spacing: 10) {
                            Image(systemName: "map.fill")
                                .font(.system(size: 30, weight: .bold))
                                .foregroundStyle(ComeGetItTheme.cyan)
                            Text(venue.address)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(ComeGetItTheme.text)
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                    }
                    .allowsHitTesting(false)
                }
            }
            .clipShape(.rect(cornerRadius: 22))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(ComeGetItTheme.border, lineWidth: 1))
    }
}
