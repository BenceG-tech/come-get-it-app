import Foundation

extension KeyedDecodingContainer {
    nonisolated func decodeLossyString(forKey key: Key) -> String? {
        if let value = try? decodeIfPresent(String.self, forKey: key) { return value }
        if let value = try? decodeIfPresent(Int.self, forKey: key) { return String(value) }
        if let value = try? decodeIfPresent(Double.self, forKey: key) { return String(value) }
        if let value = try? decodeIfPresent(Bool.self, forKey: key) { return String(value) }
        return nil
    }

    nonisolated func decodeLossyDouble(forKey key: Key) -> Double? {
        if let value = try? decodeIfPresent(Double.self, forKey: key) { return value }
        if let value = try? decodeIfPresent(Int.self, forKey: key) { return Double(value) }
        if let value = try? decodeIfPresent(String.self, forKey: key) { return Double(value.trimmingCharacters(in: .whitespacesAndNewlines)) }
        return nil
    }

    nonisolated func decodeLossyInt(forKey key: Key) -> Int? {
        if let value = try? decodeIfPresent(Int.self, forKey: key) { return value }
        if let value = try? decodeIfPresent(Double.self, forKey: key) { return Int(value) }
        if let value = try? decodeIfPresent(String.self, forKey: key) { return Int(value.trimmingCharacters(in: .whitespacesAndNewlines)) }
        return nil
    }

    nonisolated func decodeLossyBool(forKey key: Key) -> Bool? {
        if let value = try? decodeIfPresent(Bool.self, forKey: key) { return value }
        if let value = try? decodeIfPresent(Int.self, forKey: key) { return value != 0 }
        if let value = try? decodeIfPresent(String.self, forKey: key) {
            let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if ["true", "1", "yes", "igen"].contains(normalized) { return true }
            if ["false", "0", "no", "nem"].contains(normalized) { return false }
        }
        return nil
    }

    nonisolated func decodeLossyStringArray(forKey key: Key) -> [String]? {
        if let value = try? decodeIfPresent([String].self, forKey: key) { return value }
        if let value = try? decodeIfPresent(String.self, forKey: key) {
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if trimmed.hasPrefix("[") {
                guard let data = trimmed.data(using: .utf8), let decoded = try? JSONDecoder().decode([String].self, from: data) else { return nil }
                return decoded
            }
            return trimmed.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
        }
        return nil
    }
}
