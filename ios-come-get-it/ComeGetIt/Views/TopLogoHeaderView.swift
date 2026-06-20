import SwiftUI

struct TopLogoHeaderView: View {
    let onSearch: () -> Void
    let onMap: () -> Void

    var body: some View {
        ZStack {
            HStack(spacing: 12) {
                Spacer()
                Button(action: onSearch) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                }
                .comeGetItGlass(in: Circle())

                Button(action: onMap) {
                    Image(systemName: "mappin.and.ellipse")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                }
                .comeGetItGlass(in: Circle())
            }

            AsyncImage(url: ComeGetItTheme.logoURL) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                default:
                    Text("Come Get It")
                        .font(.title.weight(.black))
                        .foregroundStyle(ComeGetItTheme.text)
                }
            }
            .frame(width: 164, height: 74)
            .accessibilityLabel("Come Get It logo")
        }
        .padding(.horizontal, 16)
        .padding(.top, 2)
        .padding(.bottom, 4)
    }
}
