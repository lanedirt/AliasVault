import Foundation
import SQLite

/// Extension for the VaultStore class to handle database management
extension VaultStore {
    /// Whether the vault has been stored on the device
    public var hasEncryptedDatabase: Bool {
        return FileManager.default.fileExists(atPath: getEncryptedDbPath().path)
    }

    /// Store the encrypted database
    public func storeEncryptedDatabase(_ base64EncryptedDb: String) throws {
        try base64EncryptedDb.write(to: getEncryptedDbPath(), atomically: true, encoding: .utf8)
    }

    /// Get the encrypted database
    public func getEncryptedDatabase() -> String? {
        do {
            return try String(contentsOf: getEncryptedDbPath(), encoding: .utf8)
        } catch {
            return nil
        }
    }

    /// Unlock the vault - decrypt the database and setup the database with the decrypted data
    public func unlockVault() throws {
        guard let encryptedDbBase64 = getEncryptedDatabase() else {
            throw NSError(domain: "VaultStore", code: 1, userInfo: [NSLocalizedDescriptionKey: "No encrypted database found"])
        }

        let encryptedDbData = Data(base64Encoded: encryptedDbBase64)!

        // Try to decrypt the database twice to handle cases where the first attempt fails
        // and this first attempt was using the cached encryption key.
        if encryptionKey != nil {
            // There is a cached encryption key, so we try to decrypt the database with it.
            // If this fails, we remove the cached key and try a second time triggering
            // re-authentication.
            do {
                let decryptedDbBase64 = try decrypt(data: encryptedDbData)
                try setupDatabaseWithDecryptedData(decryptedDbBase64)
                return
            } catch {
                print("First decryption attempt with cached key failed: \(error)")
                encryptionKey = nil
            }
        }

        // No cached key or first attempt failed — trigger authentication and try again
        do {
            let decryptedDbBase64 = try decrypt(data: encryptedDbData)
            try setupDatabaseWithDecryptedData(decryptedDbBase64)
        } catch {
            print("Second decryption attempt after reauth failed: \(error)")
            throw NSError(domain: "VaultStore", code: 5, userInfo: [NSLocalizedDescriptionKey: "Could not unlock vault"])
        }
    }

    /// Remove the encrypted database from the local filesystem
    internal func removeEncryptedDatabase() throws {
        try FileManager.default.removeItem(at: getEncryptedDbPath())
    }

    /// Get the path to the encrypted database file
    private func getEncryptedDbPath() -> URL {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: VaultConstants.keychainAccessGroup) else {
            fatalError("Failed to get shared container URL")
        }
        return containerURL.appendingPathComponent(VaultConstants.encryptedDbFileName)
    }

    /// Setup the database with the decrypted data
    private func setupDatabaseWithDecryptedData(_ decryptedDbBase64: Data) throws {
        guard let decryptedDbData = Data(base64Encoded: decryptedDbBase64) else {
            throw NSError(domain: "VaultStore", code: 10, userInfo: [NSLocalizedDescriptionKey: "Failed to decode base64 data after decryption"])
        }

        let tempDbPath = FileManager.default.temporaryDirectory.appendingPathComponent("temp_db.sqlite")
        try decryptedDbData.write(to: tempDbPath)

        self.dbConnection = try Connection(":memory:")

        try self.dbConnection?.attach(.uri(tempDbPath.path, parameters: [.mode(.readOnly)]), as: "source")
        try self.dbConnection?.execute("BEGIN TRANSACTION")

        let tables = try self.dbConnection?.prepare("SELECT name FROM source.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        for table in tables! {
            guard let tableName = table[0] as? String else {
                print("Warning: Unexpected value in table name column")
                continue
            }
            try self.dbConnection?.execute("CREATE TABLE \(tableName) AS SELECT * FROM source.\(tableName)")
        }

        try self.dbConnection?.execute("COMMIT")
        try self.dbConnection?.execute("DETACH DATABASE source")

        try? FileManager.default.removeItem(at: tempDbPath)

        try self.dbConnection?.execute("PRAGMA journal_mode = WAL")
        try self.dbConnection?.execute("PRAGMA synchronous = NORMAL")
        try self.dbConnection?.execute("PRAGMA foreign_keys = ON")
    }
}
