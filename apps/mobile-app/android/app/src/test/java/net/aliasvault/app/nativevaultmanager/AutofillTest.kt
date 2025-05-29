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
        // Create test credentials
        testCredentials = listOf(
            createTestCredential(
                "Gmail",
                "https://gmail.com",
                "user@gmail.com",
            ),
            createTestCredential(
                "Google",
                "https://google.com",
                "user@gmail.com",
            ),
            createTestCredential(
                "Coolblue",
                "https://www.coolblue.nl",
                "user@coolblue.nl",
            ),
            createTestCredential(
                "Amazon",
                "https://amazon.com",
                "user@amazon.com",
            ),
            createTestCredential(
                "Coolblue App",
                "com.coolblue.app",
                "user@coolblue.nl",
            ),
        )
    }

    @Test
    fun testExactUrlMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "www.coolblue.nl",
        )

        assertEquals(1, matches.size)
        assertEquals("Coolblue", matches[0].service.name)
    }

    @Test
    fun testBaseUrlMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://gmail.com/signin",
        )

        assertEquals(1, matches.size)
        assertEquals("Gmail", matches[0].service.name)
    }

    @Test
    fun testRootDomainMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://mail.google.com",
        )

        assertEquals(1, matches.size)
        assertEquals("Google", matches[0].service.name)
    }

    @Test
    fun testDomainNamePartMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://coolblue.be",
        )

        assertEquals(2, matches.size)
        assertTrue(matches.any { it.service.name == "Coolblue" })
        assertTrue(matches.any { it.service.name == "Coolblue App" })
    }

    @Test
    fun testPackageNameMatch() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "com.coolblue.app",
        )

        assertEquals(2, matches.size)
        assertTrue(matches.any { it.service.name == "Coolblue" })
        assertTrue(matches.any { it.service.name == "Coolblue App" })
    }

    @Test
    fun testNoMatches() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "https://nonexistent.com",
        )

        assertTrue(matches.isEmpty())
    }

    @Test
    fun testInvalidUrl() {
        val matches = CredentialMatcher.filterCredentialsByAppInfo(
            testCredentials,
            "not a url",
        )

        assertTrue(matches.isEmpty())
    }

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
