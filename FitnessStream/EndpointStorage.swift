import Foundation
import Security

/// Persists the configurable stream endpoint URL (UserDefaults) and API key (Keychain).
enum EndpointStorage {
    private static let urlKey = "com.fitnessstream.endpointURL"
    private static let apiKeyService = "com.fitnessstream"
    private static let apiKeyAccount = "apiKey"

    static var endpointURL: String? {
        get { UserDefaults.standard.string(forKey: urlKey) }
        set { UserDefaults.standard.set(newValue, forKey: urlKey) }
    }

    static var apiKey: String? {
        get { readKeychain() }
        set { writeKeychain(newValue) }
    }

    private static let frequencyKey = "com.fitnessstream.writeFrequency"

    /// How often metrics are POSTed to the endpoint, in seconds (1–30). Defaults to 5.
    static var writeFrequency: TimeInterval {
        get {
            let value = UserDefaults.standard.double(forKey: frequencyKey)
            return value >= 1 ? value : 5.0
        }
        set {
            UserDefaults.standard.set(max(1, min(30, newValue)), forKey: frequencyKey)
        }
    }

    private static let streamEnabledKey = "com.fitnessstream.streamEnabled"

    /// Whether streaming to the endpoint is enabled. Defaults to true.
    static var streamEnabled: Bool {
        get {
            if UserDefaults.standard.object(forKey: streamEnabledKey) == nil { return true }
            return UserDefaults.standard.bool(forKey: streamEnabledKey)
        }
        set { UserDefaults.standard.set(newValue, forKey: streamEnabledKey) }
    }

    static func clear() {
        UserDefaults.standard.removeObject(forKey: urlKey)
        UserDefaults.standard.removeObject(forKey: frequencyKey)
        writeKeychain(nil)
    }

    // MARK: - Keychain helpers

    private static func readKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String:  apiKeyService,
            kSecAttrAccount as String:  apiKeyAccount,
            kSecReturnData as String:   true,
            kSecMatchLimit as String:   kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        return value
    }

    private static func writeKeychain(_ value: String?) {
        let deleteQuery: [String: Any] = [
            kSecClass as String:       kSecClassGenericPassword,
            kSecAttrService as String:  apiKeyService,
            kSecAttrAccount as String:  apiKeyAccount,
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        guard let value, !value.isEmpty,
              let data = value.data(using: .utf8) else { return }

        let addQuery: [String: Any] = [
            kSecClass as String:            kSecClassGenericPassword,
            kSecAttrService as String:       apiKeyService,
            kSecAttrAccount as String:       apiKeyAccount,
            kSecValueData as String:         data,
            kSecAttrAccessible as String:    kSecAttrAccessibleAfterFirstUnlock,
        ]
        SecItemAdd(addQuery as CFDictionary, nil)
    }
}
