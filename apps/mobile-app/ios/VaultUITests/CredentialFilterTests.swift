import XCTest
@testable import VaultUI
@testable import VaultModels

final class CredentialFilterTests: XCTestCase {
    private var testCredentials: [Credential] = []

    override func setUp() {
        super.setUp()

        // Create test credentials using shared test data structure
        testCredentials = createSharedTestCredentials()
    }

    override func tearDown() {
        testCredentials.removeAll()
        super.tearDown()
    }

    // [#1] - Exact URL match
    func testExactUrlMatch() {
        let matches = filterCredentials(testCredentials, searchText: "www.coolblue.nl")

        XCTAssertEqual(matches.count, 1)
        XCTAssertEqual(matches.first?.service.name, "Coolblue")
    }

    // [#2] - Base URL with path match
    func testBaseUrlMatch() {
        let matches = filterCredentials(testCredentials, searchText: "https://gmail.com/signin")

        XCTAssertEqual(matches.count, 1)
        XCTAssertEqual(matches.first?.service.name, "Gmail")
    }

    // [#3] - Root domain with subdomain match
    func testRootDomainMatch() {
        let matches = filterCredentials(testCredentials, searchText: "https://mail.google.com")

        XCTAssertEqual(matches.count, 1)
        XCTAssertEqual(matches.first?.service.name, "Google")
    }

    // [#4] - No matches for non-existent domain
    func testNoMatches() {
        let matches = filterCredentials(testCredentials, searchText: "https://nonexistent.com")

        XCTAssertTrue(matches.isEmpty)
    }

    // New comprehensive test cases
    // [#5] - Partial URL stored matches full URL search
    func testPartialUrlMatchWithFullUrl() {
        // Test case: stored URL is "dumpert.nl", search with full URL
        let matches = filterCredentials(testCredentials, searchText: "https://www.dumpert.nl")

        XCTAssertEqual(matches.count, 1)
        XCTAssertEqual(matches.first?.service.name, "Dumpert")
    }

    // [#6] - Full URL stored matches partial URL search
    func testFullUrlMatchWithPartialUrl() {
        // Test case: stored URL is full, search with partial
        let matches = filterCredentials(testCredentials, searchText: "coolblue.nl")

        XCTAssertEqual(matches.count, 1)
        XCTAssertTrue(matches.contains { $0.service.name == "Coolblue" })
    }

    // [#7] - Protocol variations (http/https/none) match
    func testProtocolVariations() {
        // Test that http and https variations match
        let httpsMatches = filterCredentials(testCredentials, searchText: "https://github.com")
        let httpMatches = filterCredentials(testCredentials, searchText: "http://github.com")
        let noProtocolMatches = filterCredentials(testCredentials, searchText: "github.com")

        XCTAssertEqual(httpsMatches.count, 1)
        XCTAssertEqual(httpMatches.count, 1)
        XCTAssertEqual(noProtocolMatches.count, 1)
        XCTAssertEqual(httpsMatches.first?.service.name, "GitHub")
        XCTAssertEqual(httpMatches.first?.service.name, "GitHub")
        XCTAssertEqual(noProtocolMatches.first?.service.name, "GitHub")
    }

    // [#8] - WWW prefix variations match
    func testWwwVariations() {
        // Test that www variations match
        let withWww = filterCredentials(testCredentials, searchText: "www.dumpert.nl")
        let withoutWww = filterCredentials(testCredentials, searchText: "dumpert.nl")

        XCTAssertEqual(withWww.count, 1)
        XCTAssertEqual(withoutWww.count, 1)
        XCTAssertEqual(withWww.first?.service.name, "Dumpert")
        XCTAssertEqual(withoutWww.first?.service.name, "Dumpert")
    }

    // [#9] - Subdomain matching
    func testSubdomainMatching() {
        // Test subdomain matching
        let appSubdomain = filterCredentials(testCredentials, searchText: "https://app.example.com")
        let wwwSubdomain = filterCredentials(testCredentials, searchText: "https://www.example.com")
        let noSubdomain = filterCredentials(testCredentials, searchText: "https://example.com")

        XCTAssertEqual(appSubdomain.count, 1)
        XCTAssertEqual(appSubdomain.first?.service.name, "Subdomain Example")
        XCTAssertEqual(wwwSubdomain.count, 1)
        XCTAssertEqual(wwwSubdomain.first?.service.name, "Subdomain Example")
        XCTAssertEqual(noSubdomain.count, 1)
        XCTAssertEqual(noSubdomain.first?.service.name, "Subdomain Example")
    }

    // [#10] - Paths and query strings ignored
    func testPathAndQueryIgnored() {
        // Test that paths and query strings are ignored
        let withPath = filterCredentials(testCredentials, searchText: "https://github.com/user/repo")
        let withQuery = filterCredentials(testCredentials, searchText: "https://stackoverflow.com/questions?tab=newest")
        let withFragment = filterCredentials(testCredentials, searchText: "https://gmail.com#inbox")

        XCTAssertEqual(withPath.count, 1)
        XCTAssertEqual(withPath.first?.service.name, "GitHub")
        XCTAssertEqual(withQuery.count, 1)
        XCTAssertEqual(withQuery.first?.service.name, "Stack Overflow")
        XCTAssertEqual(withFragment.count, 1)
        XCTAssertEqual(withFragment.first?.service.name, "Gmail")
    }

    // [#11] - Complex URL variations
    func testComplexUrlVariations() {
        // Test complex URL matching scenario
        let matches = filterCredentials(testCredentials, searchText: "https://www.coolblue.nl/product/12345?ref=google")

        XCTAssertEqual(matches.count, 1)
        XCTAssertTrue(matches.contains { $0.service.name == "Coolblue" })
    }

    // [#13] - Title-only matching
    func testTitleOnlyMatching() {
        // Test service name matching when no URL is available
        let matches = filterCredentials(testCredentials, searchText: "newyorktimes")

        XCTAssertEqual(matches.count, 1)
        XCTAssertEqual(matches.first?.service.name, "Title Only newyorktimes")
    }

    // MARK: - Shared Test Data

    /**
     * Creates the shared test credential dataset used across all platforms.
     * This ensures consistent testing across Browser Extension, iOS, and Android.
     */
    private func createSharedTestCredentials() -> [Credential] {
        return [
            createTestCredential(serviceName: "Gmail", serviceUrl: "https://gmail.com", username: "user@gmail.com"),
            createTestCredential(serviceName: "Google", serviceUrl: "https://google.com", username: "user@google.com"),
            createTestCredential(serviceName: "Coolblue", serviceUrl: "https://www.coolblue.nl", username: "user@coolblue.nl"),
            createTestCredential(serviceName: "Amazon", serviceUrl: "https://amazon.com", username: "user@amazon.com"),
            createTestCredential(serviceName: "Coolblue App", serviceUrl: "com.coolblue.app", username: "user@coolblue.nl"),
            createTestCredential(serviceName: "Dumpert", serviceUrl: "dumpert.nl", username: "user@dumpert.nl"),
            createTestCredential(serviceName: "GitHub", serviceUrl: "github.com", username: "user@github.com"),
            createTestCredential(serviceName: "Stack Overflow", serviceUrl: "https://stackoverflow.com", username: "user@stackoverflow.com"),
            createTestCredential(serviceName: "Subdomain Example", serviceUrl: "https://app.example.com", username: "user@example.com"),
            createTestCredential(serviceName: "Title Only newyorktimes", serviceUrl: "", username: ""),
        ]
    }

    /**
     * Helper function to create test credentials with standardized structure.
     * @param serviceName The name of the service
     * @param serviceUrl The URL of the service
     * @param username The username for the service
     * @returns A test credential matching the iOS Credential type
     */
    private func createTestCredential(
        serviceName: String,
        serviceUrl: String,
        username: String
    ) -> Credential {
        return Credential(
            id: UUID(),
            alias: nil, service: Service(
                id: UUID(),
                name: serviceName,
                url: serviceUrl,
                logo: nil,
                createdAt: Date(),
                updatedAt: Date(),
                isDeleted: false
            ),
            username: username,
            notes: nil, password: Password(
                id: UUID(), credentialId: UUID(),
                value: "password123",
                createdAt: Date(),
                updatedAt: Date(),
                isDeleted: false
            ),
            createdAt: Date(),
            updatedAt: Date(),
            isDeleted: false
        )
    }
}

// MARK: - Standalone Filtering Logic

/**
 * Standalone filtering function extracted from CredentialProviderViewModel.
 * This allows testing the filtering logic in isolation without needing to instantiate the view model.
 * Based on the filterCredentials() method in CredentialProviderView.swift
 */
func filterCredentials(_ credentials: [Credential], searchText: String) -> [Credential] {
    if searchText.isEmpty {
        return credentials
    }

    func extractDomain(from urlString: String) -> String {
        var domain = urlString.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        // Remove protocol if present
        domain = domain.replacingOccurrences(of: "https://", with: "")
        domain = domain.replacingOccurrences(of: "http://", with: "")
        // Remove www. prefix
        domain = domain.replacingOccurrences(of: "www.", with: "")
        // Remove path, query, and fragment
        if let firstSlash = domain.firstIndex(of: "/") {
            domain = String(domain[..<firstSlash])
        }
        if let firstQuestion = domain.firstIndex(of: "?") {
            domain = String(domain[..<firstQuestion])
        }
        if let firstHash = domain.firstIndex(of: "#") {
            domain = String(domain[..<firstHash])
        }
        return domain
    }

    func extractRootDomain(from domain: String) -> String {
        let parts = domain.components(separatedBy: ".")
        return parts.count >= 2 ? parts.suffix(2).joined(separator: ".") : domain
    }

    func domainsMatch(_ domain1: String, _ domain2: String) -> Bool {
        let d1 = extractDomain(from: domain1)
        let d2 = extractDomain(from: domain2)

        // Exact match
        if d1 == d2 { return true }

        // Check if one domain contains the other (for subdomain matching)
        if d1.contains(d2) || d2.contains(d1) { return true }

        // Check root domain match
        let d1Root = extractRootDomain(from: d1)
        let d2Root = extractRootDomain(from: d2)

        return d1Root == d2Root
    }

    // Try to parse as URL first
    let searchDomain = extractDomain(from: searchText)

    if !searchDomain.isEmpty {
        var matches: Set<Credential> = []

        // Check for domain matches with priority
        credentials.forEach { credential in
            guard let serviceUrl = credential.service.url, !serviceUrl.isEmpty else { return }

            if domainsMatch(searchText, serviceUrl) {
                matches.insert(credential)
            }
        }

        // If no domain matches found, try text search in service name
        if matches.isEmpty {
            let domainParts = searchDomain.components(separatedBy: ".")
            let domainWithoutExtension = domainParts.first?.lowercased() ?? searchDomain.lowercased()

            let nameMatches = credentials.filter { credential in
                let serviceNameMatch = credential.service.name?.lowercased().contains(domainWithoutExtension) ?? false
                let notesMatch = credential.notes?.lowercased().contains(domainWithoutExtension) ?? false
                return serviceNameMatch || notesMatch
            }
            matches.formUnion(nameMatches)
        }

        return Array(matches)
    } else {
        // Non-URL fallback: simple text search in service name, username, or notes
        let lowercasedSearch = searchText.lowercased()
        return credentials.filter { credential in
            (credential.service.name?.lowercased().contains(lowercasedSearch) ?? false) ||
            (credential.username?.lowercased().contains(lowercasedSearch) ?? false) ||
            (credential.notes?.lowercased().contains(lowercasedSearch) ?? false)
        }
    }
}
