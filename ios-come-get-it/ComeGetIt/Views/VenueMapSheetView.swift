import MapKit
import SwiftUI

// MARK: - VenueMapSheetView

struct VenueMapSheetView: View {
    let venues: [Venue]
    let onOpenVenue: (Venue) -> Void

    @State private var position: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 47.4979, longitude: 19.0402),
            span: MKCoordinateSpan(latitudeDelta: 0.08, longitudeDelta: 0.08)
        )
    )

    // MARK: Sheet state

    @State private var sheetTopY: CGFloat = 0
    @State private var dragOffset: CGFloat = 0
    @State private var isDragging: Bool = false
    @State private var screenHeight: CGFloat = 812

    private var effectiveSheetTop: CGFloat {
        sheetTopY + dragOffset
    }

    // MARK: Detents

    private func collapsedY(for height: CGFloat) -> CGFloat { height * 0.84 }
    private func halfY(for height: CGFloat) -> CGFloat { height * 0.50 }
    private func fullY(for height: CGFloat) -> CGFloat { height * 0.10 }

    // MARK: Body

    var body: some View {
        GeometryReader { geometry in
            let height = geometry.size.height
            let collapsedY = collapsedY(for: height)
            let halfY = halfY(for: height)
            let fullY = fullY(for: height)
            let clampedY = min(max(effectiveSheetTop, fullY), collapsedY)
            let mapHeight = clampedY

            ZStack(alignment: .top) {
                // ── Map ──
                Map(position: $position) {
                    ForEach(venues.filter(\.hasCoordinate)) { venue in
                        Marker(
                            venue.name,
                            systemImage: "wineglass.fill",
                            coordinate: CLLocationCoordinate2D(
                                latitude: venue.effectiveLatitude ?? 47.4979,
                                longitude: venue.effectiveLongitude ?? 19.0402
                            )
                        )
                        .tint(ComeGetItTheme.cyan)
                    }
                }
                .mapStyle(.standard(elevation: .realistic))
                .frame(width: geometry.size.width, height: mapHeight)
                .clipped()
                .allowsHitTesting(!isDragging)

                // ── Dark gradient veil over map when sheet is open ──
                LinearGradient(
                    colors: [Color.black.opacity(0), Color.black.opacity(0.35)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(width: geometry.size.width, height: mapHeight)
                .allowsHitTesting(false)

                // ── Sheet ──
                sheetPanel(height: height, collapsedY: collapsedY, halfY: halfY, fullY: fullY)
                    .offset(y: clampedY)
                    .gesture(
                        DragGesture(minimumDistance: 0, coordinateSpace: .global)
                            .onChanged { value in
                                if !isDragging { isDragging = true }
                                dragOffset = value.translation.height
                            }
                            .onEnded { value in
                                isDragging = false
                                let predicted = effectiveSheetTop + value.predictedEndTranslation.height
                                let velocity = value.predictedEndTranslation.height - value.translation.height
                                snapToNearest(
                                    currentY: effectiveSheetTop,
                                    predictedY: predicted,
                                    velocity: velocity,
                                    collapsedY: collapsedY,
                                    halfY: halfY,
                                    fullY: fullY
                                )
                                dragOffset = 0
                            }
                    )
            }
            .ignoresSafeArea()
            .onAppear {
                screenHeight = height
                sheetTopY = collapsedYVal
            }
            .onChange(of: height) { _, newHeight in
                screenHeight = newHeight
                let ratio = newHeight > 0 ? sheetTopY / max(screenHeight, 1) : 0.84
                sheetTopY = collapsedY(for: newHeight) * ratio / 0.84
            }
        }
        .navigationTitle("Térkép")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(ComeGetItTheme.background.opacity(0.6), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    // MARK: - Sheet Panel

    private func sheetPanel(height: CGFloat, collapsedY: CGFloat, halfY: CGFloat, fullY: CGFloat) -> some View {
        VStack(spacing: 0) {
            // Drag handle
            dragHandle
                .padding(.top, 10)
                .padding(.bottom, 8)

            // List header
            HStack {
                Text("Helyszínek")
                    .font(.title3.weight(.heavy))
                    .foregroundStyle(ComeGetItTheme.text)
                Spacer()
                Text("\(venues.count) hely")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(ComeGetItTheme.textSecondary)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 12)

            // Venue list
            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(venues) { venue in
                        Button {
                            onOpenVenue(venue)
                        } label: {
                            compactVenueCard(venue)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 48)
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .frame(width: UIScreen.main.bounds.width, height: height)
        .background(alignment: .top) {
            sheetBackground(height: height)
        }
        .clipShape(.rect(topLeadingRadius: 20, topTrailingRadius: 20))
        .shadow(color: .black.opacity(0.5), radius: 24, x: 0, y: -6)
    }

    // MARK: - Drag Handle

    private var dragHandle: some View {
        Capsule()
            .fill(ComeGetItTheme.textSecondary.opacity(0.45))
            .frame(width: 36, height: 5)
    }

    // MARK: - Sheet Background

    private func sheetBackground(height: CGFloat) -> some View {
        ZStack {
            if #available(iOS 26.0, *) {
                Color.clear
                    .glassEffect(.regular.tint(ComeGetItTheme.cyan.opacity(0.06)), in: .rect)
            } else {
                Rectangle()
                    .fill(.ultraThinMaterial)
                    .overlay(Color.black.opacity(0.55))
            }

            // top edge highlight
            Rectangle()
                .fill(ComeGetItTheme.border)
                .frame(height: 0.5)
                .frame(maxHeight: .infinity, alignment: .top)
        }
        .ignoresSafeArea(edges: .bottom)
    }

    // MARK: - Compact Venue Card

    private func compactVenueCard(_ venue: Venue) -> some View {
        HStack(spacing: 12) {
            // Thumbnail
            RemoteImageFillView(
                url: venue.displayImageURL ?? ComeGetItTheme.fallbackVenueImageURL,
                height: 68,
                fallbackSymbol: "wineglass.fill"
            )
            .frame(width: 72, height: 68)
            .clipShape(.rect(cornerRadius: 14))

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(venue.name)
                    .font(.subheadline.weight(.heavy))
                    .foregroundStyle(ComeGetItTheme.text)
                    .lineLimit(1)

                Text(venue.address)
                    .font(.caption)
                    .foregroundStyle(ComeGetItTheme.textSecondary)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    if let distance = venue.distance {
                        HStack(spacing: 3) {
                            Image(systemName: "location.fill")
                                .font(.system(size: 9, weight: .bold))
                            Text("\(Int(distance))m")
                                .font(.caption2.weight(.bold))
                        }
                        .foregroundStyle(ComeGetItTheme.cyan)
                    }

                    if let pts = venue.pointsPerVisit, pts > 0 {
                        HStack(spacing: 3) {
                            Image(systemName: "star.fill")
                                .font(.system(size: 9, weight: .bold))
                            Text("+\(pts)")
                                .font(.caption2.weight(.bold))
                        }
                        .foregroundStyle(Color(red: 1.0, green: 0.84, blue: 0.27))
                    }

                    if let firstTag = venue.tags.first {
                        Text(firstTag)
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(ComeGetItTheme.textSecondary.opacity(0.7))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(ComeGetItTheme.border, in: .capsule)
                    }
                }
            }

            Spacer()

            // Chevron
            Image(systemName: "chevron.right")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(ComeGetItTheme.textSecondary.opacity(0.5))
        }
        .padding(10)
        .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(ComeGetItTheme.border, lineWidth: 1))
    }

    // MARK: - Snap Logic

    private func snapToNearest(
        currentY: CGFloat,
        predictedY: CGFloat,
        velocity: CGFloat,
        collapsedY: CGFloat,
        halfY: CGFloat,
        fullY: CGFloat
    ) {
        let targets = [fullY, halfY, collapsedY]
        let velocityWeight: CGFloat = 0.3

        let adjustedY: CGFloat
        if abs(velocity) > 200 {
            adjustedY = velocity > 0 ? collapsedY : fullY
        } else {
            let best = targets.min(by: { abs($0 - predictedY) < abs($1 - predictedY) }) ?? collapsedY
            let blend = predictedY * (1 - velocityWeight) + best * velocityWeight
            let blendedTarget = targets.min(by: { abs($0 - blend) < abs($1 - blend) }) ?? best
            adjustedY = min(max(blendedTarget, fullY), collapsedY)
        }

        withAnimation(.spring(response: 0.42, dampingFraction: 0.78)) {
            sheetTopY = adjustedY
        }
    }
}
