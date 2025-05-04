import Foundation
import CryptoKit
import LocalAuthentication
import KeychainAccess

/// Extension for the VaultStore class to handle encryption/decryption
extension VaultStore {
    /// Store the encryption key - the key used to encrypt and decrypt the vault
    public func storeEncryptionKey(base64Key: String) throws {
        guard let keyData = Data(base64Encoded: base64Key) else {
            throw NSError(domain: "VaultStore", code: 6, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 key"])
        }

        guard keyData.count == 32 else {
            throw NSError(domain: "VaultStore", code: 7, userInfo: [NSLocalizedDescriptionKey: "Invalid key length. Expected 32 bytes"])
        }

        encryptionKey = keyData
        print("Stored key in memory")

        if enabledAuthMethods.contains(.faceID) {
            print("Face ID is enabled, storing key in keychain")
            do {
                try keychain
                    .authenticationPrompt("Authenticate to save your vault decryption key in the iOS keychain")
                    .set(keyData, key: VaultConstants.encryptionKeyKey)
                print("Encryption key saved successfully to keychain")
            } catch {
                print("Failed to save encryption key to keychain: \(error)")
            }
        } else {
            print("Face ID is disabled, not storing encryption key in keychain")
        }
    }

    /// Encrypt the data using the encryption key
    internal func encrypt(data: Data) throws -> Data {
        let localEncryptionKey = try getEncryptionKey()

        let key = SymmetricKey(data: localEncryptionKey)
        let sealedBox = try AES.GCM.seal(data, using: key)
        return sealedBox.combined!
    }

    /// Decrypt the data using the encryption key
    internal func decrypt(data: Data) throws -> Data {
        let localEncryptionKey = try getEncryptionKey()

        let key = SymmetricKey(data: localEncryptionKey)
        let sealedBox = try AES.GCM.SealedBox(combined: data)
        return try AES.GCM.open(sealedBox, using: key)
    }

    /// Get the encryption key - the key used to encrypt and decrypt the vault.
    /// This method is meant to only be used internally by the VaultStore class and not
    /// be exposed to the public API or React Native for security reasons.
    internal func getEncryptionKey() throws -> Data {
        if let key = encryptionKey {
            return key
        }

        if enabledAuthMethods.contains(.faceID) {
            let context = LAContext()
            var error: NSError?

            #if targetEnvironment(simulator)
                print("Simulator detected, skipping biometric policy evaluation check and continuing with key retrieval from keychain")
            #else
                guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
                    throw NSError(domain: "VaultStore", code: 2, userInfo: [NSLocalizedDescriptionKey: "Face ID not available: \(error?.localizedDescription ?? "Unknown error")"])
                }
            #endif

            print("Attempting to get encryption key from keychain as Face ID is enabled as an option")
            do {
                guard let keyData = try keychain
                    .authenticationPrompt("Authenticate to unlock your vault")
                    .getData(VaultConstants.encryptionKeyKey) else {
                    throw NSError(domain: "VaultStore", code: 2, userInfo: [NSLocalizedDescriptionKey: "No encryption key found"])
                }
                encryptionKey = keyData
                return keyData
            } catch let keychainError as KeychainAccess.Status {
                switch keychainError {
                case .itemNotFound:
                    throw NSError(domain: "VaultStore", code: 2, userInfo: [NSLocalizedDescriptionKey: "No encryption key found"])
                case .authFailed:
                    throw NSError(domain: "VaultStore", code: 8, userInfo: [NSLocalizedDescriptionKey: "Authentication failed"])
                default:
                    throw NSError(domain: "VaultStore", code: 9, userInfo: [NSLocalizedDescriptionKey: "Keychain access error: \(keychainError.localizedDescription)"])
                }
            } catch {
                throw NSError(domain: "VaultStore", code: 9, userInfo: [NSLocalizedDescriptionKey: "Unexpected error accessing keychain: \(error.localizedDescription)"])
            }
        }

        throw NSError(domain: "VaultStore", code: 3, userInfo: [NSLocalizedDescriptionKey: "No encryption key found in memory"])
    }
}