import SwiftUI

struct RemoteImageFillView: View {
    let url: URL?
    let height: CGFloat
    let fallbackSymbol: String

    var body: some View {
        Color.white.opacity(0.06)
            .frame(height: height)
            .overlay {
                if let url {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .empty:
                            shimmer
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .allowsHitTesting(false)
                        case .failure:
                            fallback
                        @unknown default:
                            fallback
                        }
                    }
                } else {
                    fallback
                }
            }
            .clipped()
    }

    private var shimmer: some View {
        LinearGradient(
            colors: [Color.white.opacity(0.04), Color.white.opacity(0.12), Color.white.opacity(0.04)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .allowsHitTesting(false)
    }

    private var fallback: some View {
        ZStack {
            ComeGetItTheme.heroGradient
            Image(systemName: fallbackSymbol)
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(ComeGetItTheme.cyan.opacity(0.75))
        }
        .allowsHitTesting(false)
    }
}
