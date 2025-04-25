import Foundation
import KeychainAccess
import SQLite
import LocalAuthentication
import CryptoKit
import CommonCrypto

/**
 * This class is used to store and retrieve the encrypted AliasVault database and encryption key.
 * It also handles executing queries against the SQLite database and biometric authentication.
 *
 * This class is used by both the iOS Autofill extension and the React Native app and is the lowest
 * level where all important data is stored and retrieved from.
 */
class VaultStore {
    static let shared = VaultStore()
    private let keychain = Keychain(service: "net.aliasvault.autofill", accessGroup: "group.net.aliasvault.autofill")
        .accessibility(.whenPasscodeSetThisDeviceOnly, authenticationPolicy: .biometryAny)

    private var db: Connection?
    private var encryptionKey: Data?
    private var clearCacheTimer: Timer?

    private let vaultMetadataKey = "aliasvault_vault_metadata"
    private let encryptionKeyKey = "aliasvault_encryption_key"
    private let encryptedDbFileName = "encrypted_db.sqlite"
    private let authMethodsKey = "aliasvault_auth_methods"
    private let autoLockTimeoutKey = "aliasvault_auto_lock_timeout"

    // Date formatter for parsing SQLite datetime strings
    private lazy var dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()

    // User config with default values
    private var enabledAuthMethods: AuthMethods = [.password, .faceID] // Default to Face ID and password
    private var autoLockTimeout: Int = 3600 // Default to 1 hour (3600 seconds)

    public init() {
        // Load saved auth methods from UserDefaults if they exist
        if UserDefaults.standard.object(forKey: authMethodsKey) != nil {
            let savedRawValue = UserDefaults.standard.integer(forKey: authMethodsKey)
            enabledAuthMethods = AuthMethods(rawValue: savedRawValue)
        }

        // Load auto-lock timeout from UserDefaults if it exists
        if UserDefaults.standard.object(forKey: autoLockTimeoutKey) != nil {
            autoLockTimeout = UserDefaults.standard.integer(forKey: autoLockTimeoutKey)
        }

        // Add notification observers
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        clearCacheTimer?.invalidate()
    }

    @objc private func appDidEnterBackground() {
        print("App entered background, starting auto-lock timer with \(autoLockTimeout) seconds")
        // Start timer to clear cache after auto-lock timeout
        if autoLockTimeout > 0 {
            clearCacheTimer = Timer.scheduledTimer(withTimeInterval: TimeInterval(autoLockTimeout), repeats: false) { [weak self] _ in
                print("Auto-lock timer fired, clearing cache")
                self?.clearCache()
            }
        }
    }

    @objc private func appWillEnterForeground() {
        print("App will enter foreground, canceling clear cache timer")

        // Check if timer has elapsed
        if let timer = clearCacheTimer, timer.fireDate < Date() {
            print("Timer has elapsed, cache should have been cleared already when app was in background, but clearing it again to be sure")
            clearCache()
        }

        // Cancel the timer if app comes back to foreground
        clearCacheTimer?.invalidate()
        clearCacheTimer = nil
    }

    // MARK: - Auth Methods Management
    func setAuthMethods(_ methods: AuthMethods) throws {
        enabledAuthMethods = methods
        UserDefaults.standard.set(methods.rawValue, forKey: authMethodsKey)
        UserDefaults.standard.synchronize()

        if !enabledAuthMethods.contains(.faceID) {
            print("Face ID is now disabled, removing key from keychain immediately")
            do {
                try keychain
                    .authenticationPrompt("Authenticate to remove your vault decryption key")
                    .remove(encryptionKeyKey)
                print("Successfully removed encryption key from keychain")
            } catch {
                print("Failed to remove encryption key from keychain: \(error)")
                throw error
            }
        }
        else {
            print("Face ID is now enabled, next time user logs in the key will be persisted in keychain")
        }
    }

    func getAuthMethods() -> AuthMethods {
        return enabledAuthMethods
    }

    func getAuthMethodsAsStrings() -> [String] {
        var methods: [String] = []
        if enabledAuthMethods.contains(.faceID) {
            methods.append("faceid")
        }
        if enabledAuthMethods.contains(.password) {
            methods.append("password")
        }
        return methods
    }

    // MARK: - Vault Status
    func isVaultInitialized() -> Bool {
        // Check if encrypted database file exists
        let hasDatabase = FileManager.default.fileExists(atPath: getEncryptedDbPath().path)

        return hasDatabase
    }

    func isVaultUnlocked() -> Bool {
        // Check if encryption key is in memory
        return encryptionKey != nil
    }

    // MARK: - Encryption Key Management
    private func getEncryptionKey() throws -> Data {
        if let key = encryptionKey {
            return key
        }

        // If Face ID is enabled, try to get the key from keychain
        if enabledAuthMethods.contains(.faceID) {
            let context = LAContext()
            var error: NSError?

            guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
                throw NSError(domain: "VaultStore", code: 2, userInfo: [NSLocalizedDescriptionKey: "Face ID not available: \(error?.localizedDescription ?? "Unknown error")"])
            }

            // Get the encryption key from keychain
            print("Attempting to get encryption key from keychain as Face ID is enabled as an option")
            do {
                guard let keyData = try keychain
                    .authenticationPrompt("Authenticate to unlock your vault")
                    .getData(encryptionKeyKey) else {
                    throw NSError(domain: "VaultStore", code: 2, userInfo: [NSLocalizedDescriptionKey: "No encryption key found"])
                }
                encryptionKey = keyData
                return keyData
            } catch let keychainError as KeychainAccess.Status {
                // Handle specific keychain errors
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

        // If Face ID is not enabled and we don't have a key in memory, throw an error
        throw NSError(domain: "VaultStore", code: 3, userInfo: [NSLocalizedDescriptionKey: "No encryption key found in memory"])
    }

    func storeEncryptionKey(base64Key: String) throws {
        // Convert base64 string to bytes
        guard let keyData = Data(base64Encoded: base64Key) else {
            throw NSError(domain: "VaultStore", code: 6, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 key"])
        }

        // Validate key length (AES-256 requires 32 bytes)
        guard keyData.count == 32 else {
            throw NSError(domain: "VaultStore", code: 7, userInfo: [NSLocalizedDescriptionKey: "Invalid key length. Expected 32 bytes"])
        }

        // Store the key in memory
        encryptionKey = keyData
        print("Stored key in memory")

        // Store the key in the keychain if Face ID is enabled
        if enabledAuthMethods.contains(.faceID) {
            print("Face ID is enabled, storing key in keychain")
            do {
                try keychain
                    .authenticationPrompt("Authenticate to save your vault decryption key in the iOS keychain")
                    .set(keyData, key: encryptionKeyKey)
                print("Encryption key saved succesfully to keychain")
            } catch {
                // If storing the key fails, we don't throw an error because it's not critical.
                // The decryption key will then only be stored in memory which requires the user
                // to re-authenticate on next app launch. We only print for logging purposes.
                print("Failed to save encryption key to keychain: \(error)")
            }
        }
        else {
            print("Face ID is disabled, not storing encryption key in keychain")
        }
    }

    // MARK: - Database Management

    private func getEncryptedDbPath() -> URL {
        guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.net.aliasvault.autofill") else {
            fatalError("Failed to get shared container URL")
        }
        return containerURL.appendingPathComponent(encryptedDbFileName)
    }

    // Store the encrypted database (base64 encoded) in the app's documents directory
    // and metadata in UserDefaults
    // TODO: refactor metadata save and retrieve calls to separate calls for better clarity throughtout
    // full call chain?
    func storeEncryptedDatabase(_ base64EncryptedDb: String, metadata: String) throws {
        // Store the encrypted database (base64 encoded) in the app's documents directory
        try base64EncryptedDb.write(to: getEncryptedDbPath(), atomically: true, encoding: .utf8)

        // Store metadata in UserDefaults
        UserDefaults.standard.set(metadata, forKey: vaultMetadataKey)
        UserDefaults.standard.synchronize()
    }

    // Get the encrypted database as a base64 encoded string
    private func getEncryptedDatabase() -> String? {
        do {
            // Return the base64 encoded string
            return try String(contentsOf: getEncryptedDbPath(), encoding: .utf8)
        } catch {
            return nil
        }
    }

    // Get the vault metadata from UserDefaults
    public func getVaultMetadata() -> String? {
        return UserDefaults.standard.string(forKey: vaultMetadataKey)
    }

    /**
     * Initialize the database.
     *
     * This function will decrypt the encrypted database and import it into an in-memory database.
     * Note: as part of decryption, executing this function can prompt the user for biometric authentication.
     *
     * The in-memory database is used for all queries and updates to the database.
     */
    func initializeDatabase() throws {
        // Get the encrypted database
        guard let encryptedDbBase64 = getEncryptedDatabase() else {
            throw NSError(domain: "VaultStore", code: 1, userInfo: [NSLocalizedDescriptionKey: "No encrypted database found"])
        }

        let encryptedDbData = Data(base64Encoded: encryptedDbBase64)!

        // Get the encryption key
        let encryptionKey = try getEncryptionKey()
        let decryptedDbBase64 = try decrypt(data: encryptedDbData, key: encryptionKey)

        // The decrypted data is still base64 encoded, so decode it
        guard let decryptedDbData = Data(base64Encoded: decryptedDbBase64) else {
            throw NSError(domain: "VaultStore", code: 10, userInfo: [NSLocalizedDescriptionKey: "Failed to decode base64 data after decryption"])
        }

        // Create a temporary file for the decrypted database in the same directory as the encrypted one
        let tempDbPath = FileManager.default.temporaryDirectory.appendingPathComponent("temp_db.sqlite")
        try decryptedDbData.write(to: tempDbPath)

        // Create an in-memory database
        db = try Connection(":memory:")

        // Import the decrypted database into memory
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
        // After initialization attempt, check if db is still nil
        guard let db = db else {
            throw NSError(domain: "VaultStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
        }

        // TODO: update this to use the actual database schema.
        // TODO: having the add logic here means we have duplicate code with the react native implementation.
        let credentials = Table("credentials")
        let id = Expression<String>("id")
        let username = Expression<String>("username")
        let password = Expression<String>("password")
        let service = Expression<String>("service")
        let createdAt = Expression<Date>("created_at")
        let updatedAt = Expression<Date>("updated_at")

        try db.run(credentials.insert(
            id <- UUID().uuidString,
            username <- credential.username ?? "",
            password <- credential.password?.value ?? "",
            service <- credential.service.name ?? "",
            createdAt <- Date(),
            updatedAt <- Date()
        ))
    }

    func getAllCredentials() throws -> [Credential] {
        // After initialization attempt, check if db is still nil
        guard let db = db else {
            throw NSError(domain: "VaultStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
        }

        print("Executing get all credentials query..")

        let query = """
            WITH LatestPasswords AS (
                SELECT
                    p.Id as password_id,
                    p.CredentialId,
                    p.Value,
                    p.CreatedAt,
                    p.UpdatedAt,
                    p.IsDeleted,
                    ROW_NUMBER() OVER (PARTITION BY p.CredentialId ORDER BY p.CreatedAt DESC) as rn
                FROM Passwords p
                WHERE p.IsDeleted = 0
            )
            SELECT
                c.Id,
                c.AliasId,
                c.Username,
                c.Notes,
                c.CreatedAt,
                c.UpdatedAt,
                c.IsDeleted,
                s.Id as service_id,
                s.Name as service_name,
                s.Url as service_url,
                s.Logo as service_logo,
                s.CreatedAt as service_created_at,
                s.UpdatedAt as service_updated_at,
                s.IsDeleted as service_is_deleted,
                lp.password_id,
                lp.Value as password_value,
                lp.CreatedAt as password_created_at,
                lp.UpdatedAt as password_updated_at,
                lp.IsDeleted as password_is_deleted
            FROM Credentials c
            LEFT JOIN Services s ON s.Id = c.ServiceId AND s.IsDeleted = 0
            LEFT JOIN LatestPasswords lp ON lp.CredentialId = c.Id AND lp.rn = 1
            WHERE c.IsDeleted = 0
            ORDER BY c.CreatedAt DESC
        """

        var result: [Credential] = []
        for row in try db.prepare(query) {
            guard let idString = row[0] as? String,
                  let aliasIdString = row[1] as? String,
                  let createdAtString = row[4] as? String,
                  let updatedAtString = row[5] as? String,
                  let isDeleted = row[6] as? Int,
                  let createdAt = dateFormatter.date(from: createdAtString),
                  let updatedAt = dateFormatter.date(from: updatedAtString) else {
                continue
            }

            // Create Service object if service data exists
            guard let serviceId = row[7] as? String,
                  let serviceCreatedAtString = row[11] as? String,
                  let serviceUpdatedAtString = row[12] as? String,
                  let serviceIsDeleted = row[13] as? Int,
                  let serviceCreatedAt = dateFormatter.date(from: serviceCreatedAtString),
                  let serviceUpdatedAt = dateFormatter.date(from: serviceUpdatedAtString) else {
                continue
            }

            let service = Service(
                id: UUID(uuidString: serviceId)!,
                name: row[8] as? String,
                url: row[9] as? String,
                logo: row[10] as? Data,
                createdAt: serviceCreatedAt,
                updatedAt: serviceUpdatedAt,
                isDeleted: serviceIsDeleted == 1
            )

            // Create Password object if password data exists
            var password: Password? = nil
            if let passwordIdString = row[14] as? String,
               let passwordValue = row[15] as? String,
               let passwordCreatedAtString = row[16] as? String,
               let passwordUpdatedAtString = row[17] as? String,
               let passwordIsDeleted = row[18] as? Int,
               let passwordCreatedAt = dateFormatter.date(from: passwordCreatedAtString),
               let passwordUpdatedAt = dateFormatter.date(from: passwordUpdatedAtString) {
                password = Password(
                    id: UUID(uuidString: passwordIdString)!,
                    credentialId: UUID(uuidString: idString)!,
                    value: passwordValue,
                    createdAt: passwordCreatedAt,
                    updatedAt: passwordUpdatedAt,
                    isDeleted: passwordIsDeleted == 1
                )
            }

            let credential = Credential(
                id: UUID(uuidString: idString)!,
                aliasId: UUID(uuidString: aliasIdString)!,
                service: service,
                username: row[2] as? String,
                notes: row[3] as? String,
                password: password,
                createdAt: createdAt,
                updatedAt: updatedAt,
                isDeleted: isDeleted == 1
            )
            result.append(credential)
        }

        print("Found \(result.count) credentials")

        return result
    }

    // Clears cached encryption key and encrypted database to force re-initialization on next access.
    func clearCache() {
        print("Clearing cache - removing encryption key and decrypted database from memory")

        // Clear the cached encryption key
        encryptionKey = nil

        // Clear the cached encrypted database
        db = nil
    }

    // Clears cached and saved encryption key and encrypted database to force re-initialization on next access.
    func clearVault() {
        print("Clearing vault - removing all stored data")

        // Remove the encryption key from keychain with proper error handling
        do {
            try keychain
                .authenticationPrompt("Authenticate to remove your vault decryption key")
                .remove(encryptionKeyKey)
            print("Successfully removed encryption key from keychain")
        } catch {
            print("Failed to remove encryption key from keychain: \(error)")
        }

        // Remove the encrypted database from the app's documents directory
        do {
            try FileManager.default.removeItem(at: getEncryptedDbPath())
            print("Successfully removed encrypted database file")
        } catch {
            print("Failed to remove encrypted database file: \(error)")
        }

        // Clear UserDefaults
        UserDefaults.standard.removeObject(forKey: vaultMetadataKey)
        UserDefaults.standard.removeObject(forKey: authMethodsKey)
        UserDefaults.standard.removeObject(forKey: autoLockTimeoutKey)
        UserDefaults.standard.synchronize()
        print("Cleared UserDefaults")

        clearCache()
    }

    // MARK: - Query Execution

    func executeQuery(_ query: String, params: [Binding?]) throws -> [[String: Any]] {
        guard let db = db else {
            throw NSError(domain: "VaultStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
        }

        let statement = try db.prepare(query)
        var results: [[String: Any]] = []

        for row in try statement.run(params) {
            var rowDict: [String: Any] = [:]
            for (index, column) in statement.columnNames.enumerated() {
                // Handle different SQLite data types appropriately
                let value = row[index]
                switch value {
                case let data as SQLite.Blob:
                    // Convert SQLite blob to base64 string for React Native bridge
                    let binaryData = Data(data.bytes)
                    rowDict[column] = binaryData.base64EncodedString()
                case let date as Date:
                    rowDict[column] = date
                case let number as Int64:
                    rowDict[column] = number
                case let number as Double:
                    rowDict[column] = number
                case let text as String:
                    rowDict[column] = text
                case .none:
                    rowDict[column] = NSNull()
                default:
                    rowDict[column] = value
                }
            }
            results.append(rowDict)
        }

        return results
    }

    func executeUpdate(_ query: String, params: [Binding?]) throws -> Int {
        guard let db = db else {
            throw NSError(domain: "VaultStore", code: 4, userInfo: [NSLocalizedDescriptionKey: "Database not initialized"])
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
            throw error ?? NSError(domain: "VaultStore", code: 5, userInfo: [NSLocalizedDescriptionKey: "Biometrics not available"])
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

    // MARK: - Auto Lock Timeout Management
    func setAutoLockTimeout(_ timeout: Int) {
        print("Setting auto-lock timeout to \(timeout) seconds")
        autoLockTimeout = timeout
        UserDefaults.standard.set(timeout, forKey: autoLockTimeoutKey)
        UserDefaults.standard.synchronize()
    }

    func getAutoLockTimeout() -> Int {
        return autoLockTimeout
    }
}
