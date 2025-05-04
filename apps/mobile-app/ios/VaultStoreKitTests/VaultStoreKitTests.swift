//
//  VaultStoreKitTests.swift
//  VaultStoreKitTests
//
//  Created by Leendert de Borst on 27/04/2025.
//

import XCTest
@testable import VaultStoreKit

final public class VaultStoreKitTests: XCTestCase {
    var vaultStore: VaultStore!
    let testEncryptionKeyBase64 = "/9So3C83JLDIfjsF0VQOc4rz1uAFtIseW7yrUuztAD0=" // 32 bytes for AES-256

    override public func setUp() {
        super.setUp()
        vaultStore = VaultStore.shared

        do {
            try vaultStore.storeEncryptionKey(base64Key: testEncryptionKeyBase64)

            let encryptedDb = try loadTestDatabase()
            try vaultStore.storeEncryptedDatabase(encryptedDb)

            let metadata = """
            {
                "publicEmailDomains": ["spamok.com", "spamok.nl"],
                "privateEmailDomains": ["aliasvault.net", "main.aliasvault.net"],
                "vaultRevisionNumber": 1
            }
            """
            try vaultStore.storeMetadata(metadata)

            try vaultStore.unlockVault()
        } catch {
            XCTFail("setUp failed with error: \(error)")
        }
    }

    override public func tearDown() {
        // Clean up after each test
        vaultStore.clearVault()
        super.tearDown()
    }

    func testDatabaseInitialization() async throws {
        // If we get here without throwing, initialization was successful
        XCTAssertTrue(vaultStore.isVaultUnlocked, "Vault should be unlocked after initialization")
    }

    func testGetAllCredentials() async throws {
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

    /**
     * This test verifies that the Gmail credential details are correct including
     * the expectedlogo binary data.
     */
    func testGetGmailCredentialDetails() async throws {
        // Get all credentials
        let credentials = try vaultStore.getAllCredentials()

        // Find the Gmail credential
        let gmailCredential = credentials.first { $0.service.name == "Gmail Test Account" }
        XCTAssertNotNil(gmailCredential, "Gmail Test Account credential should exist")

        if let gmail = gmailCredential {
            // Verify all expected properties
            XCTAssertEqual(gmail.service.name, "Gmail Test Account")
            XCTAssertEqual(gmail.service.url, "https://google.com")
            XCTAssertEqual(gmail.username, "test.user@gmail.com")
            XCTAssertEqual(gmail.alias?.firstName, "Test")
            XCTAssertEqual(gmail.alias?.lastName, "User")
            XCTAssertEqual(gmail.notes, "Test Gmail account for unit testing")

            // Verify logo exists and has sufficient size
            XCTAssertNotNil(gmail.service.logo, "Service logo should not be nil")
            if let logoData = gmail.service.logo {
                XCTAssertGreaterThan(logoData.count, 1024, "Logo data should exceed 1KB in size")
            }
        }
    }

    // Helper method to load test database file
    private func loadTestDatabase() throws -> String {
        // Look in the root of the test bundle Resources
        guard let testDbPath = Bundle(for: type(of: self))
                .path(forResource: "test-encrypted-vault", ofType: "txt")
        else {
            throw NSError(domain: "VaultStoreKitTests",
                          code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Test database file not found"])
        }

        return try String(contentsOfFile: testDbPath, encoding: .utf8)
    }
}
