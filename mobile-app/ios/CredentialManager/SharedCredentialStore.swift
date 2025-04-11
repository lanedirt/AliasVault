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
    private var encryptionKey: Data?
    
    private init() {}
    
    // MARK: - Encryption Key Management
    
    private func getEncryptionKey() throws -> Data {
        if let key = encryptionKey {
            // print as base64 for debugging
            print("Key found in memory: \(key.base64EncodedString())")
            return key
        }
        
        guard let keyData = try? keychain
            .authenticationPrompt("Authenticate to unlock your vault")
            .getData(encryptionKeyKey) else {
            throw NSError(domain: "SharedCredentialStore", code: 2, userInfo: [NSLocalizedDescriptionKey: "No encryption key found"])
        }
        
        encryptionKey = keyData
        // print as base64 for debugging
        print("Key found in keychain: \(keyData.base64EncodedString())")
        return keyData
    }
    
    func storeEncryptionKey(_ base64Key: String) throws {
        print("Storing encryption key")
        
        // Convert base64 string to bytes
        guard let keyData = Data(base64Encoded: base64Key) else {
            throw NSError(domain: "SharedCredentialStore", code: 6, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 key"])
        }
        
        // Validate key length (AES-256 requires 32 bytes)
        guard keyData.count == 32 else {
            throw NSError(domain: "SharedCredentialStore", code: 7, userInfo: [NSLocalizedDescriptionKey: "Invalid key length. Expected 32 bytes"])
        }
        
        do {
            try keychain
                .authenticationPrompt("Authenticate to unlock your vault")
                .set(keyData, key: encryptionKeyKey)
            encryptionKey = keyData
            // print as base64 for debugging
            print("Key saved in keychain: \(keyData.base64EncodedString())")
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
        // Store the encrypted database (base64 encoded) in the app's documents directory
        try base64EncryptedDb.write(to: getEncryptedDbPath(), atomically: true, encoding: .utf8)
    }
    
    // Get the encrypted database as a base64 encoded string
    func getEncryptedDatabase() -> String? {
        do {
            // Return the base64 encoded string
            return try String(contentsOf: getEncryptedDbPath(), encoding: .utf8)
        } catch {
            return nil
        }
    }
    
    func initializeDatabase() throws {
        // Get the encrypted database
        guard let encryptedDbBase64 = getEncryptedDatabase() else {
            throw NSError(domain: "SharedCredentialStore", code: 1, userInfo: [NSLocalizedDescriptionKey: "No encrypted database found"])
        }
        
        let encryptedDbData = Data(base64Encoded: encryptedDbBase64)!

        // Get the encryption key
        let encryptionKey = try getEncryptionKey()
        let decryptedDbBase64 = try decrypt(data: encryptedDbData, key: encryptionKey)

        // The decrypted data is still base64 encoded, so decode it
        guard let decryptedDbData = Data(base64Encoded: decryptedDbBase64) else {
            throw NSError(domain: "SharedCredentialStore", code: 10, userInfo: [NSLocalizedDescriptionKey: "Failed to decode base64 data after decryption"])
        }

        // Check SQLite header
        let header = decryptedDbData.prefix(24)
        let headerString = String(bytes: header, encoding: .ascii) ?? "Non-ascii"
        print("SQLite header: \(headerString)")
        print("Header bytes: \(header.map { String(format: "%02x", $0) }.joined(separator: " "))")
        
        // Verify it matches expected SQLite header
        let expectedHeader = "SQLite format 3\0"
        if headerString != expectedHeader {
            print("WARNING: SQLite header does not match expected format!")
        }

        print("decrypted data raw print?")
        print(decryptedDbData)

        let tag = decryptedDbData.suffix(16)
        print("tag: \(tag.base64EncodedString())")

        // Create a temporary file for the decrypted database in the same directory as the encrypted one
        let tempDbPath = FileManager.default.temporaryDirectory.appendingPathComponent("temp_db.sqlite")
        try decryptedDbData.write(to: tempDbPath)
        
        do {
            let tempDb = try Connection(tempDbPath.path)
            let tables = try tempDb.prepare("SELECT name FROM sqlite_master WHERE type='table'")
            for table in tables {
                print("Table:", table[0] as? String ?? "Unknown")
            }
        } catch {
            print("Direct DB open error:", error)
        }
        
        // Create an in-memory database
        db = try Connection(":memory:")
        
        // Import the decrypted database into memory
        //try db?.attach(.uri(tempDbPath.path, parameters: [.mode(.readOnly)]), as: "source")
        // make query and print it before actually attaching
        try db?.attach(.uri(tempDbPath.path, parameters: [.mode(.readOnly)]), as: "source")
        try db?.execute("BEGIN TRANSACTION")
        
        // Copy all tables from source to memory
        let tables = try db?.prepare("SELECT name FROM source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        for table in tables! {
            let tableName = table[0] as! String
            try db?.execute("CREATE TABLE \(tableName) AS SELECT * FROM source.\(tableName)")
        }
        
        try db?.execute("COMMIT")
        try db?.execute("DETACH DATABASE source")
        
        // Clean up the temporary file
        try? FileManager.default.removeItem(at: tempDbPath)
        
        // Setup database pragmas
        try db?.execute("PRAGMA journal_mode = WAL")
        try db?.execute("PRAGMA synchronous = NORMAL")
        try db?.execute("PRAGMA foreign_keys = ON")
    }
    
    // MARK: - Encryption/Decryption
    
    private func encrypt(data: Data, key: Data) throws -> Data {
        // TODO: make sure we encrypt the data the same as decryption works with combined iv/content/tag.
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
