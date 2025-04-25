import XCTest

class VaultStoreTests: XCTestCase {
    var vaultStore: VaultStore!
    let testEncryptionKey = "testEncryptionKey1234567890123456789012" // 32 bytes for AES-256

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
        try vaultStore.storeEncryptionKey(base64Key: testEncryptionKey)

        // Then try to initialize the database
        try vaultStore.initializeDatabase()

        // If we get here without throwing, initialization was successful
        XCTAssertTrue(vaultStore.isVaultUnlocked(), "Vault should be unlocked after initialization")
    }

    func testGetAllCredentials() async throws {
        // First, store the encryption key
        try vaultStore.storeEncryptionKey(base64Key: testEncryptionKey)

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
    private func loadTestDatabase() throws -> Data {
        // TODO: Add your test database file to the test bundle
        // and load it here
        guard let testDbPath = Bundle(for: type(of: self)).path(forResource: "test_db", ofType: "sqlite") else {
            throw NSError(domain: "VaultStoreTests", code: 1, userInfo: [NSLocalizedDescriptionKey: "Test database file not found"])
        }
        return try Data(contentsOf: URL(fileURLWithPath: testDbPath))
    }
}
