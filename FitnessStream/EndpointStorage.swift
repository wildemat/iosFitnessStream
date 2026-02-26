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

    static func clear() {
        UserDefaults.standard.removeObject(forKey: urlKey)
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
