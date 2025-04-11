import Foundation
import KeychainAccess
import SQLite
import LocalAuthentication
import CryptoKit
import CommonCrypto

class SharedCredentialStore {
    static let shared = SharedCredentialStore()
    private let keychain = Keychain(service: "net.aliasvault.autofill", accessGroup: "group.net.aliasvault.autofill")
        .accessibility(.whenPasscodeSetThisDeviceOnly, authenticationPolicy: [.biometryAny])
    private let encryptionKeyKey = "aliasvault_encryption_key"
    private let encryptedDbFileName = "encrypted_db.sqlite"
    private var db: Connection?
    
    private init() {}
    
    // MARK: - Encryption Key Management
    
    func storeEncryptionKey(_ base64Key: String) throws {
        print("Storing encryption key")
        guard let keyData = Data(base64Encoded: base64Key) else {
            throw NSError(domain: "SharedCredentialStore", code: 6, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 key"])
        }
        
        do {
            try keychain
                .authenticationPrompt("Authenticate to unlock your vault")
                .set(keyData, key: encryptionKeyKey)
            print("Key saved in keychain")
        } catch {
            print("Failed to save key to keychain: \(error)")
            throw error
        }
    }
    
    // MARK: - Database Management
    
    private func getEncryptedDbPath() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsDirectory.appendingPathComponent(encryptedDbFileName)
    }
    
    func storeEncryptedDatabase(_ base64EncryptedDb: String) throws {
        guard let encryptedData = Data(base64Encoded: base64EncryptedDb) else {
            throw NSError(domain: "SharedCredentialStore", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 data"])
        }
        
        // Store the encrypted database in the app's documents directory
        try encryptedData.write(to: getEncryptedDbPath())
    }
    
    func getEncryptedDatabase() -> String? {
        do {
            let encryptedData = try Data(contentsOf: getEncryptedDbPath())
            return encryptedData.base64EncodedString()
        } catch {
            return nil
        }
    }
    
    func initializeDatabase() throws {
        // Get the encrypted database
        guard let base64EncryptedDb = getEncryptedDatabase() else {
            throw NSError(domain: "SharedCredentialStore", code: 1, userInfo: [NSLocalizedDescriptionKey: "No encrypted database found"])
        }
        
        // Get the encryption key
        guard let keyData = try? keychain
            .authenticationPrompt("Authenticate to unlock your vault")
            .getData(encryptionKeyKey) else {
            throw NSError(domain: "SharedCredentialStore", code: 2, userInfo: [NSLocalizedDescriptionKey: "No encryption key found"])
        }
        
        // Convert base64 strings to data
        guard let encryptedData = Data(base64Encoded: base64EncryptedDb) else {
            throw NSError(domain: "SharedCredentialStore", code: 3, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 data"])
        }
        
        // Decrypt the database
        let decryptedData = try decrypt(data: encryptedData, key: keyData)
        
        // Create an in-memory database
        db = try Connection(":memory:")
        
        // Import the decrypted database into memory
        try db?.execute("ATTACH DATABASE '\(decryptedData)' AS source")
        try db?.execute("BEGIN TRANSACTION")
        
        // Copy all tables from source to memory
        let tables = try db?.prepare("SELECT name FROM source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        for table in tables! {
            let tableName = table[0] as! String
            try db?.execute("CREATE TABLE \(tableName) AS SELECT * FROM source.\(tableName)")
        }
        
        try db?.execute("COMMIT")
        try db?.execute("DETACH DATABASE source")
        
        // Setup database pragmas
        try db?.execute("PRAGMA journal_mode = WAL")
        try db?.execute("PRAGMA synchronous = NORMAL")
        try db?.execute("PRAGMA foreign_keys = ON")
    }
    
    // MARK: - Encryption/Decryption
    
    private func encrypt(data: Data, key: Data) throws -> Data {
        let key = SymmetricKey(data: key)
        let sealedBox = try AES.GCM.seal(data, using: key)
        return sealedBox.combined!
    }
    
    private func decrypt(data: Data, key: Data) throws -> Data {
        let key = SymmetricKey(data: key)
        let sealedBox = try AES.GCM.SealedBox(combined: data)
        return try AES.GCM.open(sealedBox, using: key)
    }
    
    // MARK: - Credential Operations
    
    func addCredential(_ credential: Credential) throws {
        guard let db = db else {
            throw NSError(domain: "SharedCredentialStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
        }
        
        let credentials = Table("credentials")
        let id = Expression<String>("id")
        let username = Expression<String>("username")
        let password = Expression<String>("password")
        let service = Expression<String>("service")
        let createdAt = Expression<Date>("created_at")
        let updatedAt = Expression<Date>("updated_at")
        
        try db.run(credentials.insert(
            id <- UUID().uuidString,
            username <- credential.username,
            password <- credential.password,
            service <- credential.service,
            createdAt <- Date(),
            updatedAt <- Date()
        ))
    }
    
    func getAllCredentials() throws -> [Credential] {
        guard let db = db else {
            throw NSError(domain: "SharedCredentialStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
        }
        
        let credentials = Table("credentials")
        let username = Expression<String>("username")
        let password = Expression<String>("password")
        let service = Expression<String>("service")
        
        var result: [Credential] = []
        for row in try db.prepare(credentials) {
            result.append(Credential(
                username: row[username],
                password: row[password],
                service: row[service]
            ))
        }
        return result
    }
    
    func clearAllCredentials() {
        guard let db = db else { return }
        
        let credentials = Table("credentials")
        try? db.run(credentials.delete())
    }
    
    // MARK: - Query Execution
    
    func executeQuery(_ query: String, params: [Binding?]) throws -> [[String: Any]] {
        guard let db = db else {
            throw NSError(domain: "SharedCredentialStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
        }
        
        let statement = try db.prepare(query)
        var results: [[String: Any]] = []
        
        for row in statement {
            var rowDict: [String: Any] = [:]
            for (index, column) in statement.columnNames.enumerated() {
                rowDict[column] = row[index]
            }
            results.append(rowDict)
        }
        
        return results
    }
    
    func executeUpdate(_ query: String, params: [Binding?]) throws -> Int {
        guard let db = db else {
            throw NSError(domain: "SharedCredentialStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
        }
        
        let statement = try db.prepare(query)
        try statement.run(params)
        return db.changes
    }
    
    // MARK: - Biometric Authentication
    
    func authenticateWithBiometrics() async throws -> Bool {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw error ?? NSError(domain: "SharedCredentialStore", code: 5, userInfo: [NSLocalizedDescriptionKey: "Biometrics not available"])
        }
        
        return try await withCheckedThrowingContinuation { continuation in
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                                 localizedReason: "Authenticate to access your credentials") { success, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: success)
                }
            }
        }
    }
}
