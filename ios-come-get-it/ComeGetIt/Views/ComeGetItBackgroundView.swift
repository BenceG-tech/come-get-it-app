import SwiftUI

struct ComeGetItBackgroundView: View {
    var body: some View {
        ZStack {
            Color.black
            RadialGradient(
                colors: [ComeGetItTheme.cyan.opacity(0.18), .clear],
                center: .topTrailing,
                startRadius: 20,
                endRadius: 360
            )
            RadialGradient(
                colors: [ComeGetItTheme.cyanDeep.opacity(0.22), .clear],
                center: .bottomLeading,
                startRadius: 80,
                endRadius: 420
            )
        }
        .ignoresSafeArea()
    }
}
