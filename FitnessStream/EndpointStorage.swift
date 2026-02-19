import Foundation

/// Persists the configurable stream endpoint URL in UserDefaults.
enum EndpointStorage {
    private static let key = "com.fitnessstream.endpointURL"

    static var endpointURL: String? {
        get { UserDefaults.standard.string(forKey: key) }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }

    static func clear() {
        UserDefaults.standard.removeObject(forKey: key)
    }
}
