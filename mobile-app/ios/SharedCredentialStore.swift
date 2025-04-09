import Foundation
import KeychainAccess
import CryptoKit

public struct Credential: Codable {
    public let username: String
    public let password: String
    public let service: String
    
    public init(username: String, password: String, service: String) {
        self.username = username
        self.password = password
        self.service = service
    }
}

public class SharedCredentialStore {
    public static let shared = SharedCredentialStore()
    private let userDefaults: UserDefaults
    private let encryptionKeyKey = "encryptionKey"
    private let credentialsKey = "storedCredentials"
    private var cachedEncryptionKey: SymmetricKey?
    
    private init() {
        // Use the app group identifier
        userDefaults = UserDefaults(suiteName: "group.net.aliasvault.autofill")!
    }
    
    private func getEncryptionKey(createKeyIfNeeded: Bool = true) throws -> SymmetricKey {
        print("Getting encryption key")
        
        if let cached = cachedEncryptionKey {
            // Verify the cached key is valid by checking its bit length
            if cached.bitCount == 256 {
                print("Using cached encryption key")
                return cached
            } else {
                print("Cached key is invalid, clearing cache")
                cachedEncryptionKey = nil
            }
        }
        
        print("No cached key, accessing keychain")
        // Create a new keychain instance with authentication required for this specific access
        let authKeychain = Keychain(service: "net.aliasvault.autofill", accessGroup: "group.net.aliasvault.autofill")
            .accessibility(.whenPasscodeSetThisDeviceOnly, authenticationPolicy: [.biometryAny])        
            
        if let keyData = try? authKeychain
            .authenticationPrompt("Authenticate to unlock your vault")
            .getData(encryptionKeyKey) {
            
            print("Found existing key in keychain")
            let key = SymmetricKey(data: keyData)
            cachedEncryptionKey = key
            print("Returning existing key")
            return key
        }
        
        if createKeyIfNeeded {
            print("Creating new encryption key")
            // Create new key if none exists
            let key = SymmetricKey(size: .bits256)
            do {
                try authKeychain
                    .authenticationPrompt("Authenticate to unlock your vault")
                    .set(key.withUnsafeBytes { Data($0) }, key: encryptionKeyKey)
                print("New key saved in keychain")
            } catch {
                print("Failed to save key to keychain: \(error)")
            }

            cachedEncryptionKey = key
            return key
        } else {
            print("No encryption key found in keychain")
            throw NSError(domain: "SharedCredentialStore", code: -1, userInfo: [NSLocalizedDescriptionKey: "No encryption key found in keychain"])
        }
    }
    
    private func encrypt(_ data: Data, createKeyIfNeeded: Bool = true) throws -> Data {
        print("Encrypting data")
        let key = try getEncryptionKey(createKeyIfNeeded: createKeyIfNeeded)
        print("Using key with bit length: \(key.bitCount)")
        let sealedBox = try AES.GCM.seal(data, using: key)
        guard let combined = sealedBox.combined else {
            print("Failed to get combined data from sealed box")
            throw NSError(domain: "SharedCredentialStore", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to get combined data from sealed box"])
        }
        print("Successfully encrypted data, combined length: \(combined.count)")
        return combined
    }
    
    private func decrypt(_ data: Data, createKeyIfNeeded: Bool = true) throws -> Data {
        print("Decrypting data with length: \(data.count)")
        let key = try getEncryptionKey(createKeyIfNeeded: createKeyIfNeeded)
        print("Using key with bit length: \(key.bitCount)")
        do {
            let sealedBox = try AES.GCM.SealedBox(combined: data)
            print("Successfully created sealed box")
            let decryptedData = try AES.GCM.open(sealedBox, using: key)
            print("Successfully decrypted data, length: \(decryptedData.count)")
            return decryptedData
        } catch let error as CryptoKitError {
            print("CryptoKit error during decryption: \(error)")
            throw error
        } catch {
            print("Unexpected error during decryption: \(error)")
            throw error
        }
    }
    
    public func getAllCredentials(createKeyIfNeeded: Bool = true) throws -> [Credential] {
        print("Getting all credentials")
        guard let encryptedData = userDefaults.data(forKey: credentialsKey) else { 
            print("No encrypted data found in UserDefaults")
            return [] 
        }
        let decryptedData = try decrypt(encryptedData, createKeyIfNeeded: createKeyIfNeeded)
        return try JSONDecoder().decode([Credential].self, from: decryptedData)
    }
    
    public func addCredential(_ credential: Credential, createKeyIfNeeded: Bool = true) throws {
        print("Adding new credential")
        var credentials = try getAllCredentials(createKeyIfNeeded: createKeyIfNeeded)
        credentials.append(credential)
        let data = try JSONEncoder().encode(credentials)
        let encryptedData = try encrypt(data, createKeyIfNeeded: createKeyIfNeeded)
        userDefaults.set(encryptedData, forKey: credentialsKey)
    }
    
    public func clearAllCredentials() {
        print("Clearing all credentials")
        userDefaults.removeObject(forKey: credentialsKey)

        let authKeychain = Keychain(service: "net.aliasvault.autofill", accessGroup: "group.net.aliasvault.autofill")
            .accessibility(.whenPasscodeSetThisDeviceOnly, authenticationPolicy: [.biometryAny])

        try? authKeychain.authenticationPrompt("Authenticate to unlock your vault").removeAll()
    }
    
    public func clearCache() {
        print("Clearing encryption key cache")
        cachedEncryptionKey = nil
    }
}
