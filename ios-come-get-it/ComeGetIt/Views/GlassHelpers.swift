import SwiftUI

extension View {
    @ViewBuilder
    func comeGetItGlass<S: Shape>(in shape: S) -> some View {
        if #available(iOS 26.0, *) {
            self.glassEffect(.regular.tint(ComeGetItTheme.cyan.opacity(0.08)).interactive(), in: shape)
        } else {
            self
                .background(.ultraThinMaterial, in: shape)
                .overlay(shape.stroke(ComeGetItTheme.border, lineWidth: 1))
        }
    }
}
