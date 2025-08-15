package net.aliasvault.app.nativevaultmanager

import net.aliasvault.app.autofill.utils.CredentialMatcher
import net.aliasvault.app.vaultstore.models.Credential
import net.aliasvault.app.vaultstore.models.Service
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.util.Date
import java.util.UUID
import kotlin.test.DefaultAsserter.assertEquals
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28], manifest = Config.NONE)
class AutofillTest {
    private lateinit var testCredentials: List<Credential>

    @Before
    fun setup() {
        // Create test credentials using shared test data structure
        testCredentials = createSharedTestCredentials()
    }

    // [#1] - Exact URL match
    @Test
    fun testExactUrlMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "www.coolblue.nl",
        )

        assertEquals(1, matches.size)
        assertEquals("Coolblue", matches[0].service.name)
    }

    // [#2] - Base URL with path match
    @Test
    fun testBaseUrlMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://gmail.com/signin",
        )

        assertEquals(1, matches.size)
        assertEquals("Gmail", matches[0].service.name)
    }

    // [#3] - Root domain with subdomain match
    @Test
    fun testRootDomainMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://mail.google.com",
        )

        assertEquals(1, matches.size)
        assertEquals("Google", matches[0].service.name)
    }

    // [#4] - No matches for non-existent domain
    @Test
    fun testNoMatches() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://nonexistent.com",
        )

        assertTrue(matches.isEmpty())
    }

    // [#5] - Partial URL stored matches full URL search
    @Test
    fun testPartialUrlMatchWithFullUrl() {
        // Test case: stored URL is "dumpert.nl", search with full URL
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://www.dumpert.nl",
        )

        assertEquals(1, matches.size)
        assertEquals("Dumpert", matches[0].service.name)
    }

    // [#6] - Full URL stored matches partial URL search
    @Test
    fun testFullUrlMatchWithPartialUrl() {
        // Test case: stored URL is full, search with partial
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "coolblue.nl",
        )

        assertEquals(1, matches.size)
        assertEquals("Coolblue", matches[0].service.name)
    }

    // [#7] - Protocol variations (http/https/none) match
    @Test
    fun testProtocolVariations() {
        // Test that http and https variations match
        val httpsMatches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://github.com",
        )
        val httpMatches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "http://github.com",
        )
        val noProtocolMatches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "github.com",
        )

        assertEquals(1, httpsMatches.size)
        assertEquals(1, httpMatches.size)
        assertEquals(1, noProtocolMatches.size)
        assertEquals("GitHub", httpsMatches[0].service.name)
        assertEquals("GitHub", httpMatches[0].service.name)
        assertEquals("GitHub", noProtocolMatches[0].service.name)
    }

    // [#8] - WWW prefix variations match
    @Test
    fun testWwwVariations() {
        // Test that www variations match
        val withWww = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "www.dumpert.nl",
        )
        val withoutWww = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "dumpert.nl",
        )

        assertEquals(1, withWww.size)
        assertEquals(1, withoutWww.size)
        assertEquals("Dumpert", withWww[0].service.name)
        assertEquals("Dumpert", withoutWww[0].service.name)
    }

    // [#9] - Subdomain matching
    @Test
    fun testSubdomainMatching() {
        // Test subdomain matching
        val appSubdomain = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://app.example.com",
        )
        val wwwSubdomain = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://www.example.com",
        )
        val noSubdomain = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://example.com",
        )

        assertEquals(1, appSubdomain.size)
        assertEquals("Subdomain Example", appSubdomain[0].service.name)
        assertEquals(1, wwwSubdomain.size)
        assertEquals("Subdomain Example", wwwSubdomain[0].service.name)
        assertEquals(1, noSubdomain.size)
        assertEquals("Subdomain Example", noSubdomain[0].service.name)
    }

    // [#10] - Paths and query strings ignored
    @Test
    fun testPathAndQueryIgnored() {
        // Test that paths and query strings are ignored
        val withPath = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://github.com/user/repo",
        )
        val withQuery = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://stackoverflow.com/questions?tab=newest",
        )
        val withFragment = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://gmail.com#inbox",
        )

        assertEquals(1, withPath.size)
        assertEquals("GitHub", withPath[0].service.name)
        assertEquals(1, withQuery.size)
        assertEquals("Stack Overflow", withQuery[0].service.name)
        assertEquals(1, withFragment.size)
        assertEquals("Gmail", withFragment[0].service.name)
    }

    // [#11] - Complex URL variations
    @Test
    fun testComplexUrlVariations() {
        // Test complex URL matching scenario
        val complexUrl = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://www.coolblue.nl/product/12345?ref=google",
        )

        assertEquals(1, complexUrl.size)
        assertEquals("Coolblue", complexUrl[0].service.name)
    }

    // [#13] - Title-only matching
    @Test
    fun testTitleOnlyMatching() {
        // Test service name matching when no URL is available
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "newyorktimes",
        )

        assertEquals(1, matches.size)
        assertEquals("Title Only newyorktimes", matches[0].service.name)
    }

    // [#14] - Domain name part matching (Android specific)
    @Test
    fun testDomainNamePartMatch() {
        // Test that unrelated domains don't match (coolblue.be doesn't match coolblue.nl)
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://coolblue.be",
        )

        // Should find no matches due to anti-phishing protection (Coolblue has URL so won't match on text)
        assertTrue(matches.isEmpty())
    }

    // [#12] - Priority ordering (not applicable to Android)
    @Test
    fun testPriorityOrdering() {
        // Android doesn't implement priority ordering like browser extension
        // but we include the test for cross-platform consistency
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "coolblue.nl",
        )

        // Android should find domain match
        assertEquals(1, matches.size)
        assertEquals("Coolblue", matches[0].service.name)
    }

    // [#15] - Package name matching
    @Test
    fun testPackageNameMatch() {
        // Package names should match exact URL.
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "com.coolblue.app",
        )

        // Should find exact URL match for "Coolblue App"
        assertEquals(1, matches.size)
        assertTrue(matches.any { it.service.name == "Coolblue App" })
    }

    // [#16] - Invalid URL handling
    @Test
    fun testInvalidUrl() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "not a url",
        )

        assertTrue(matches.isEmpty())
    }

    // [#17] - Anti-phishing protection
    @Test
    fun testAntiPhishingProtection() {
        // Test that credentials with URLs don't match on text when URL is provided
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://secure-bankk.com", // Phishing domain (extra 'k')
        )

        // Should find no matches - Bank Account has URL so won't match on text
        assertTrue(matches.isEmpty())
    }

    /**
     * Creates the shared test credential dataset used across all platforms.
     * This ensures consistent testing across Browser Extension, iOS, and Android.
     */
    private fun createSharedTestCredentials(): List<Credential> {
        return listOf(
            createTestCredential("Gmail", "https://gmail.com", "user@gmail.com"),
            createTestCredential("Google", "https://google.com", "user@google.com"),
            createTestCredential("Coolblue", "https://www.coolblue.nl", "user@coolblue.nl"),
            createTestCredential("Amazon", "https://amazon.com", "user@amazon.com"),
            createTestCredential("Coolblue App", "com.coolblue.app", "user@coolblue.nl"),
            createTestCredential("Dumpert", "dumpert.nl", "user@dumpert.nl"),
            createTestCredential("GitHub", "github.com", "user@github.com"),
            createTestCredential("Stack Overflow", "https://stackoverflow.com", "user@stackoverflow.com"),
            createTestCredential("Subdomain Example", "https://app.example.com", "user@example.com"),
            createTestCredential("Title Only newyorktimes", "", ""),
            createTestCredential("Bank Account", "https://secure-bank.com", "user@bank.com"),
        )
    }

    /**
     * Helper function to create test credentials with standardized structure.
     * @param serviceName The name of the service
     * @param serviceUrl The URL of the service
     * @param username The username for the service
     * @return A test credential matching the Android Credential type
     */
    private fun createTestCredential(
        serviceName: String,
        serviceUrl: String,
        username: String,
    ): Credential {
        return Credential(
            id = UUID.randomUUID(),
            service = Service(
                id = UUID.randomUUID(),
                name = serviceName,
                url = serviceUrl,
                logo = null,
                createdAt = Date(),
                updatedAt = Date(),
                isDeleted = false,
            ),
            username = username,
            password = null,
            alias = null,
            notes = null,
            createdAt = Date(),
            updatedAt = Date(),
            isDeleted = false,
        )
    }
}
