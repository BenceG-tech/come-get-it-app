import SwiftUI

struct RewardsScreenView: View {
    @Environment(AppViewModel.self) private var appModel
    let onOpenFeature: (String) -> Void

    private let categories: [(String, String, String)] = [
        ("Italok", "wineglass.fill", "drink"),
        ("Étel", "fork.knife", "food"),
        ("Élmény", "sparkles", "experience"),
        ("Összes", "square.grid.2x2.fill", "all")
    ]

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 24) {
                header
                addCardPanel
                editorPicks
                referPanel
                categoriesGrid
            }
            .padding(.horizontal, 16)
            .padding(.top, 20)
            .padding(.bottom, 112)
        }
        .refreshable { await appModel.loadRewards() }
    }

    private var header: some View {
        HStack(alignment: .center) {
            Text("Jutalmak")
                .font(.largeTitle.weight(.black))
                .foregroundStyle(ComeGetItTheme.text)
            Spacer()
            Text("\(appModel.points.formatted()) POINTS")
                .font(.caption.weight(.900))
                .foregroundStyle(ComeGetItTheme.cyan)
                .padding(.horizontal, 12)
                .padding(.vertical, 9)
                .background(ComeGetItTheme.cyan.opacity(0.14), in: .capsule)
                .overlay(Capsule().stroke(ComeGetItTheme.cyan.opacity(0.28), lineWidth: 1))
        }
    }

    private var addCardPanel: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                Image(systemName: "creditcard.fill")
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(ComeGetItTheme.cyan)
                    .frame(width: 52, height: 52)
                    .background(ComeGetItTheme.cyan.opacity(0.16), in: .rect(cornerRadius: 16))
                VStack(alignment: .leading, spacing: 6) {
                    Text("Adj hozzá egy kártyát")
                        .font(.headline.weight(.900))
                        .foregroundStyle(ComeGetItTheme.text)
                    Text("Szerezz jutalompontokat minden alkalommal, amikor partnerhelyeinken költesz.")
                        .font(.subheadline)
                        .foregroundStyle(ComeGetItTheme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            Button { onOpenFeature("Kártya hozzáadása") } label: {
                Label("Kártya hozzáadása", systemImage: "lock.fill")
                    .font(.subheadline.weight(.900))
                    .foregroundStyle(Color.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 13)
                    .background(ComeGetItTheme.cyan, in: .capsule)
            }
            .buttonStyle(.plain)
        }
        .padding(18)
        .background(ComeGetItTheme.heroGradient, in: .rect(cornerRadius: 24))
        .overlay(.rect(cornerRadius: 24).stroke(ComeGetItTheme.border, lineWidth: 1))
    }

    private var editorPicks: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("♥ Szerkesztők választása")
                .font(.headline.weight(.900))
                .foregroundStyle(ComeGetItTheme.text)

            if let message = appModel.rewardErrorMessage {
                InlineNoticeView(message: message, systemImage: "giftcard")
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 14) {
                    if appModel.isLoadingRewards && appModel.rewards.isEmpty {
                        ProgressView("Jutalmak betöltése…")
                            .tint(ComeGetItTheme.cyan)
                            .frame(width: 220, height: 240)
                    } else {
                        ForEach(appModel.rewards.prefix(8)) { reward in
                            RewardCardView(reward: reward, canRedeem: appModel.points >= reward.pointsRequired)
                        }
                    }
                }
                .padding(.vertical, 4)
            }
            .contentMargins(.horizontal, 0)
        }
    }

    private var referPanel: some View {
        Button { onOpenFeature("Barátok meghívása") } label: {
            HStack(spacing: 14) {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(ComeGetItTheme.cyan)
                    .frame(width: 54, height: 54)
                    .background(ComeGetItTheme.cyan.opacity(0.12), in: Circle())
                VStack(alignment: .leading, spacing: 5) {
                    Text("Hívj meg egy barátot")
                        .font(.headline.weight(.900))
                        .foregroundStyle(ComeGetItTheme.text)
                    Text("Szerezz 500 pontot, amikor meghívsz egy barátot.")
                        .font(.subheadline)
                        .foregroundStyle(ComeGetItTheme.textSecondary)
                }
                Spacer()
            }
            .padding(18)
            .background(ComeGetItTheme.elevated, in: .rect(cornerRadius: 22))
            .overlay(.rect(cornerRadius: 22).stroke(ComeGetItTheme.cyan.opacity(0.18), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private var categoriesGrid: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("📋 Kategóriák")
                .font(.headline.weight(.900))
                .foregroundStyle(ComeGetItTheme.text)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(categories, id: \.2) { title, icon, key in
                    Button { onOpenFeature("Kategória: \(key)") } label: {
                        VStack(spacing: 12) {
                            Image(systemName: icon)
                                .font(.system(size: 24, weight: .bold))
                                .foregroundStyle(ComeGetItTheme.cyan)
                            Text(title)
                                .font(.headline.weight(.900))
                                .foregroundStyle(ComeGetItTheme.text)
                        }
                        .frame(maxWidth: .infinity, minHeight: 118)
                        .background(Color.white.opacity(0.065), in: .rect(cornerRadius: 20))
                        .overlay(.rect(cornerRadius: 20).stroke(ComeGetItTheme.border, lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}
