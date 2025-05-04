import Foundation
import LocalAuthentication
import KeychainAccess
import VaultModels

/// Extension for the VaultStore class to handle authentication methods
extension VaultStore {
    /// Set the enabled authentication methods for the vault
    public func setAuthMethods(_ methods: AuthMethods) throws {
        enabledAuthMethods = methods
        userDefaults.set(methods.rawValue, forKey: VaultConstants.authMethodsKey)
        userDefaults.synchronize()

        if !enabledAuthMethods.contains(.faceID) {
            print("Face ID is now disabled, removing key from keychain immediately")
            do {
                try keychain
                    .authenticationPrompt("Authenticate to remove your vault decryption key")
                    .remove(VaultConstants.encryptionKeyKey)
                print("Successfully removed encryption key from keychain")
            } catch {
                print("Failed to remove encryption key from keychain: \(error)")
                throw error
            }
        } else {
            print("Face ID is now enabled, next time user logs in the key will be persisted in keychain")
        }
    }

    /// Get the enabled authentication methods for the vault
    public func getAuthMethods() -> AuthMethods {
        return enabledAuthMethods
    }

    /// Get the enabled authentication methods for the vault as strings
    public func getAuthMethodsAsStrings() -> [String] {
        var methods: [String] = []
        if enabledAuthMethods.contains(.faceID) {
            methods.append("faceid")
        }
        if enabledAuthMethods.contains(.password) {
            methods.append("password")
        }
        return methods
    }
}
