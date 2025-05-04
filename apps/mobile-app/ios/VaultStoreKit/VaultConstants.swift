import Foundation
import VaultModels

struct VaultConstants {
    static let keychainService = "net.aliasvault.autofill"
    static let keychainAccessGroup = "group.net.aliasvault.autofill"
    static let userDefaultsSuite = "group.net.aliasvault.autofill"

    static let vaultMetadataKey = "aliasvault_vault_metadata"
    static let encryptionKeyKey = "aliasvault_encryption_key"
    static let encryptedDbFileName = "encrypted_db.sqlite"
    static let authMethodsKey = "aliasvault_auth_methods"
    static let autoLockTimeoutKey = "aliasvault_auto_lock_timeout"

    static let defaultAutoLockTimeout: Int = 3600 // 1 hour in seconds
    static let defaultAuthMethods: AuthMethods = [.password, .faceID]
}

