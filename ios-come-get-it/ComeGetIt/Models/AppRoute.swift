import Foundation

nonisolated enum AppRoute: Hashable, Sendable {
    case venue(String)
    case favorites
    case map
    case feature(String)
}
