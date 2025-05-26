package net.aliasvault.app.nativevaultmanager

import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import net.aliasvault.app.autofill.CredentialMatcher
import net.aliasvault.app.vaultstore.models.Credential
import net.aliasvault.app.vaultstore.models.Service
import java.util.Date
import java.util.UUID
import kotlin.test.*

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class AutofillTest {
    private lateinit var credentialMatcher: CredentialMatcher
    private lateinit var testCredentials: List<Credential>

    @Before
    fun setup() {
        credentialMatcher = CredentialMatcher()

        // Create test credentials
        testCredentials = listOf(
            createTestCredential(
                "Gmail",
                "https://gmail.com",
                "user@gmail.com"
            ),
            createTestCredential(
                "Coolblue",
                "https://www.coolblue.nl",
                "user@coolblue.nl"
            ),
            createTestCredential(
                "Amazon",
                "https://amazon.com",
                "user@amazon.com"
            ),
            createTestCredential(
                "Coolblue App",
                "com.coolblue.app",
                "user@coolblue.nl"
            )
        )
    }

    @Test
    fun testExactUrlMatch() {
        val matches = credentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://gmail.com"
        )

        assertEquals(1, matches.size)
        assertEquals("Gmail", matches[0].service.name)
    }

    @Test
    fun testBaseUrlMatch() {
        val matches = credentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://gmail.com/signin"
        )

        assertEquals(1, matches.size)
        assertEquals("Gmail", matches[0].service.name)
    }

    @Test
    fun testRootDomainMatch() {
        val matches = credentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://mail.google.com"
        )

        assertEquals(1, matches.size)
        assertEquals("Gmail", matches[0].service.name)
    }

    @Test
    fun testDomainNamePartMatch() {
        val matches = credentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://coolblue.be"
        )

        assertEquals(2, matches.size)
        assertTrue(matches.any { it.service.name == "Coolblue" })
        assertTrue(matches.any { it.service.name == "Coolblue App" })
    }

    @Test
    fun testPackageNameMatch() {
        val matches = credentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "com.coolblue.app"
        )

        assertEquals(1, matches.size)
        assertEquals("Coolblue App", matches[0].service.name)
    }

    @Test
    fun testNoMatches() {
        val matches = credentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://nonexistent.com"
        )

        assertTrue(matches.isEmpty())
    }

    @Test
    fun testInvalidUrl() {
        val matches = credentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "not a url"
        )

        assertTrue(matches.isEmpty())
    }

    private fun createTestCredential(
        serviceName: String,
        serviceUrl: String,
        username: String
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
                isDeleted = false
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
