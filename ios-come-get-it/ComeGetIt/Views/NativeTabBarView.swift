import SwiftUI

struct NativeTabBarView: View {
    @Binding var selectedTab: AppTab

    var body: some View {
        HStack(spacing: 8) {
            ForEach(AppTab.allCases) { tab in
                Button {
                    withAnimation(.spring(response: 0.32, dampingFraction: 0.78)) {
                        selectedTab = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.systemImage)
                            .font(.system(size: 17, weight: .bold))
                        Text(tab.title)
                            .font(.caption2.weight(.800))
                    }
                    .foregroundStyle(selectedTab == tab ? Color.black : ComeGetItTheme.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(selectedTab == tab ? ComeGetItTheme.cyan : Color.clear, in: .rect(cornerRadius: 16))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(6)
        .comeGetItGlass(in: .rect(cornerRadius: 24))
        .padding(.horizontal, 16)
    }
}
