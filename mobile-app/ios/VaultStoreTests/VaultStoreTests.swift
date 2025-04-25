import XCTest

class VaultStoreTests: XCTestCase {
    var vaultStore: VaultStore!
    let testEncryptionKeyBase64 = "qXcA7cJMA9gN0gfrvlbGL8/iUcay1ihT32N8i33DR/U=" // 32 bytes for AES-256

    override func setUp() {
        super.setUp()
        vaultStore = VaultStore.shared
    }

    override func tearDown() {
        // Clean up after each test
        vaultStore.clearVault()
        super.tearDown()
    }

    func testDatabaseInitialization() async throws {
        // First, store the encryption key
        try vaultStore.storeEncryptionKey(base64Key: testEncryptionKeyBase64)

        // Load and store the encrypted database
        let encryptedDb = try loadTestDatabase()
        // TODO: get metadata via vault generation and pass it here so we have all info we need for all tests.
        try vaultStore.storeEncryptedDatabase(encryptedDb, metadata: "")

        // Then try to initialize the database
        try vaultStore.initializeDatabase()

        // If we get here without throwing, initialization was successful
        XCTAssertTrue(vaultStore.isVaultUnlocked(), "Vault should be unlocked after initialization")
    }

    func testGetAllCredentials() async throws {
        // First, store the encryption key
        try vaultStore.storeEncryptionKey(base64Key: testEncryptionKeyBase64)

        // Load and store the encrypted database
        let encryptedDb = try loadTestDatabase()
        // TODO: get metadata via vault generation and pass it here so we have all info we need for all tests.
        try vaultStore.storeEncryptedDatabase(encryptedDb, metadata: "")
        
        // Initialize the database
        try vaultStore.initializeDatabase()

        // Try to get all credentials
        let credentials = try vaultStore.getAllCredentials()

        // Verify we got some credentials back
        XCTAssertFalse(credentials.isEmpty, "Should have retrieved some credentials")

        // Verify the structure of the first credential
        if let firstCredential = credentials.first {
            XCTAssertNotNil(firstCredential.id, "Credential should have an ID")
            XCTAssertNotNil(firstCredential.service, "Credential should have a service")
            XCTAssertNotNil(firstCredential.password, "Credential should have a password")
        }
    }

    // Helper method to load test database file
    private func loadTestDatabase() throws -> String {
        // Look in the root of the test bundle Resources
        guard let testDbPath = Bundle(for: type(of: self))
                .path(forResource: "test-encrypted-vault", ofType: "txt")
        else {
            throw NSError(domain: "VaultStoreTests",
                          code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Test database file not found"])
        }
        return try String(contentsOfFile: testDbPath, encoding: .utf8)
    }
}
