import Foundation

/// Persists the configurable stream endpoint URL and API key in UserDefaults.
enum EndpointStorage {
    private static let urlKey = "com.fitnessstream.endpointURL"
    private static let apiKeyKey = "com.fitnessstream.apiKey"

    static var endpointURL: String? {
        get { UserDefaults.standard.string(forKey: urlKey) }
        set { UserDefaults.standard.set(newValue, forKey: urlKey) }
    }

    static var apiKey: String? {
        get { UserDefaults.standard.string(forKey: apiKeyKey) }
        set { UserDefaults.standard.set(newValue, forKey: apiKeyKey) }
    }

    static func clear() {
        UserDefaults.standard.removeObject(forKey: urlKey)
        UserDefaults.standard.removeObject(forKey: apiKeyKey)
    }
}
