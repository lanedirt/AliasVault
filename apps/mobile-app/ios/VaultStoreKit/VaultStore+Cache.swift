import Foundation
import Security

/// Extension for the VaultStore class to handle cache management
extension VaultStore {
    /// Clear the memory - remove the encryption key and decrypted database from memory
    public func clearCache() {
        print("Clearing cache - removing encryption key and decrypted database from memory")
        self.encryptionKey = nil
        self.dbConnection = nil
    }

    /// Clear the vault storage - remove the encryption key and encrypted database from the device
    public func clearVault() throws {
        print("Clearing vault - removing all stored data")

        do {
            try removeKeyFromKeychain()
            print("Successfully removed encryption key from keychain")
        } catch {
            print("Failed to remove encryption key from keychain: \(error)")
        }

        do {
            try removeEncryptedDatabase()
            print("Successfully removed encrypted database file")
        } catch {
            print("Failed to remove encrypted database file: \(error)")
            throw error
        }

        self.userDefaults.removeObject(forKey: VaultConstants.vaultMetadataKey)
        self.userDefaults.removeObject(forKey: VaultConstants.authMethodsKey)
        self.userDefaults.removeObject(forKey: VaultConstants.autoLockTimeoutKey)
        self.userDefaults.synchronize()
        print("Cleared UserDefaults")

        clearCache()
    }

    /// Set the auto-lock timeout - the number of seconds after which the vault will be locked automatically
    public func setAutoLockTimeout(_ timeout: Int) {
        print("Setting auto-lock timeout to \(timeout) seconds")
        self.autoLockTimeout = timeout
        self.userDefaults.set(timeout, forKey: VaultConstants.autoLockTimeoutKey)
        self.userDefaults.synchronize()
    }

    /// Get the auto-lock timeout - the number of seconds after which the vault will be locked automatically
    public func getAutoLockTimeout() -> Int {
        return self.autoLockTimeout
    }
}
