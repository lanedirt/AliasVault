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
    private let encryptionKeyKey = "encryptionKey"
    private let credentialsKey = "storedCredentials"
    private var cachedEncryptionKey: SymmetricKey?
    
    private init() {
        
    }
    
    private func getEncryptionKey() throws -> SymmetricKey {
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
            .authenticationPrompt("Authenticate to unlock your vault")
        
        // Try to get existing key from keychain
        if let keyData = try? authKeychain.getData(encryptionKeyKey) {
            print("Found existing key in keychain")
            let key = SymmetricKey(data: keyData)
            cachedEncryptionKey = key
            return key
        }
        
        print("Creating new encryption key")
        // Create new key if none exists
        let key = SymmetricKey(size: .bits256)
        try authKeychain.set(key.withUnsafeBytes { Data($0) }, key: encryptionKeyKey)
        cachedEncryptionKey = key
        return key
    }
    
    private func encrypt(_ data: Data) throws -> Data {
        print("Encrypting data")
        let key = try getEncryptionKey()
        let sealedBox = try AES.GCM.seal(data, using: key)
        return sealedBox.combined ?? Data()
    }
    
    private func decrypt(_ data: Data) throws -> Data {
        print("Decrypting data")
        let key = try getEncryptionKey()
        let sealedBox = try AES.GCM.SealedBox(combined: data)
        return try AES.GCM.open(sealedBox, using: key)
    }
    
    public func getAllCredentials() -> [Credential] {
        print("Getting all credentials")
        guard let encryptedData = UserDefaults.standard.data(forKey: credentialsKey) else { 
            print("No encrypted data found in UserDefaults")
            return [] 
        }
        do {
            let decryptedData = try decrypt(encryptedData)
            return try JSONDecoder().decode([Credential].self, from: decryptedData)
        } catch {
            print("Failed to decrypt credentials: \(error)")
            return []
        }
    }
    
    public func addCredential(_ credential: Credential) {
        print("Adding new credential")
        var credentials = getAllCredentials()
        credentials.append(credential)
        do {
            let data = try JSONEncoder().encode(credentials)
            let encryptedData = try encrypt(data)
            UserDefaults.standard.set(encryptedData, forKey: credentialsKey)
        } catch {
            print("Failed to save credentials: \(error)")
        }
    }
    
    public func clearAllCredentials() {
        print("Clearing all credentials")
        UserDefaults.standard.removeObject(forKey: credentialsKey)

        let authKeychain = Keychain(service: "net.aliasvault.autofill", accessGroup: "group.net.aliasvault.autofill")
            .accessibility(.whenPasscodeSetThisDeviceOnly, authenticationPolicy: [.biometryAny])
            .authenticationPrompt("Authenticate to unlock your vault")

        try? authKeychain.removeAll()
    }
    
    public func clearCache() {
        print("Clearing encryption key cache")
        cachedEncryptionKey = nil
    }
}
