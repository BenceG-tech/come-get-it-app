import SwiftUI

struct RewardCardView: View {
    let reward: Reward
    let canRedeem: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            RemoteImageFillView(url: reward.image, height: 128, fallbackSymbol: iconName)
                .overlay(alignment: .topTrailing) {
                    Text("\(reward.pointsRequired) pont")
                        .font(.caption2.weight(.black))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.66), in: .capsule)
                        .padding(10)
                }
                .overlay(alignment: .topLeading) {
                    Image(systemName: iconName)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.black)
                        .frame(width: 30, height: 30)
                        .background(ComeGetItTheme.cyan, in: .rect(cornerRadius: 10))
                        .padding(10)
                }

            VStack(alignment: .leading, spacing: 8) {
                Text(categoryLabel)
                    .font(.caption2.weight(.black))
                    .tracking(1.1)
                    .foregroundStyle(ComeGetItTheme.textSecondary)
                Text(reward.name)
                    .font(.headline.weight(.black))
                    .foregroundStyle(ComeGetItTheme.text)
                    .lineLimit(2)
                    .frame(minHeight: 42, alignment: .topLeading)
                if let partnerName = reward.partnerName, !partnerName.isEmpty {
                    Text("Partner: \(partnerName)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(ComeGetItTheme.textSecondary)
                        .lineLimit(1)
                }
                Text("Érvényes: \(formattedDate(reward.validUntil))")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(ComeGetItTheme.textSecondary.opacity(0.86))
                Text(canRedeem ? "Beváltás" : "Még gyűjts pontot")
                    .font(.caption.weight(.black))
                    .foregroundStyle(canRedeem ? Color.black : ComeGetItTheme.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(canRedeem ? ComeGetItTheme.cyan : Color.white.opacity(0.08), in: .capsule)
            }
            .padding(14)
        }
        .frame(width: 196)
        .background(Color(red: 0.06, green: 0.095, blue: 0.085).opacity(0.96), in: .rect(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(ComeGetItTheme.border, lineWidth: 1))
        .clipShape(.rect(cornerRadius: 18))
        .shadow(color: .black.opacity(0.34), radius: 14, x: 0, y: 8)
    }

    private var iconName: String {
        switch reward.category ?? "" {
        case "drink": "wineglass.fill"
        case "food": "fork.knife"
        case "vip": "star.fill"
        case "discount": "percent"
        case "experience": "sparkles"
        default: "gift.fill"
        }
    }

    private var categoryLabel: String {
        switch reward.category ?? "" {
        case "drink": "ITAL"
        case "food": "ÉTEL"
        case "vip": "VIP"
        case "discount": "KEDVEZMÉNY"
        case "experience": "ÉLMÉNY"
        case "partner": "PARTNER"
        default: "JUTALOM"
        }
    }

    private func formattedDate(_ value: String) -> String {
        let input = DateFormatter()
        input.dateFormat = "yyyy-MM-dd"
        guard let date = input.date(from: value) else { return value }
        let output = DateFormatter()
        output.locale = Locale(identifier: "hu_HU")
        output.dateFormat = "yyyy.MM.dd."
        return output.string(from: date)
    }
}
