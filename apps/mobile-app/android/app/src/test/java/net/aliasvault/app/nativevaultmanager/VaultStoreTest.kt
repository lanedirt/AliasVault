package net.aliasvault.app.nativevaultmanager

import android.content.Context
import android.content.SharedPreferences
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.Arguments
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.Mockito.*
import org.mockito.MockitoAnnotations
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.util.concurrent.Executors
import org.junit.Assert.*
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import net.aliasvault.app.vaultstore.VaultStore
import net.aliasvault.app.vaultstore.storageprovider.TestStorageProvider

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class VaultStoreTest {
    private lateinit var vaultStore: VaultStore
    private val testEncryptionKeyBase64 = "/9So3C83JLDIfjsF0VQOc4rz1uAFtIseW7yrUuztAD0=" // 32 bytes for AES-256

    @Before
    fun setup() {
        // Store test data
        val encryptedDb = loadTestDatabase()

        // Initialize the VaultStore instance with a mock file provider that
        // is only used for testing purposes
        vaultStore = VaultStore(TestStorageProvider())

        vaultStore.storeEncryptionKey(testEncryptionKeyBase64)
        vaultStore.storeEncryptedDatabase(encryptedDb)


        val metadata = """
        {
            "publicEmailDomains": ["spamok.com", "spamok.nl"],
            "privateEmailDomains": ["aliasvault.net", "main.aliasvault.net"],
            "vaultRevisionNumber": 1
        }
        """

        val db = vaultStore.getEncryptedDatabase()

        vaultStore.storeMetadata(metadata)

        vaultStore.unlockVault()

        //vaultStore.initializeWithEncryptedData(testDb, testEncryptionKeyBase64)
    }

    @Test
    fun testDatabaseInitialization() {
        assertTrue(vaultStore.isVaultUnlocked())
    }

    @Test
    fun testGetAllCredentials() {
        val query = "SELECT * FROM credentials"
        val results = vaultStore.executeQuery(query, emptyArray())
        assertNotNull(results)
        assertTrue(results.isNotEmpty())
    }

    @Test
    fun testGetGmailCredentialDetails() {
        val query = "SELECT * FROM credentials WHERE service_name = ?"
        val params = arrayOf<Any?>("Gmail Test Account")
        val results = vaultStore.executeQuery(query, params)
        assertNotNull(results)
        assertTrue(results.isNotEmpty())
        assertEquals("Gmail Test Account", results[0]["service_name"])
    }

    @Test
    fun testTransactionManagement() {
        // Test begin transaction
        vaultStore.beginTransaction()

        // Test execute update within transaction
        val insertQuery = "INSERT INTO credentials (service_name, username) VALUES (?, ?)"
        val insertParams = arrayOf<Any?>("Test Service", "testuser")
        val affectedRows = vaultStore.executeUpdate(insertQuery, insertParams)
        assertEquals(1, affectedRows)

        // Test commit transaction
        vaultStore.commitTransaction()

        // Verify the insert was successful
        val selectQuery = "SELECT * FROM credentials WHERE service_name = ?"
        val selectParams = arrayOf<Any?>("Test Service")
        val results = vaultStore.executeQuery(selectQuery, selectParams)
        assertNotNull(results)
        assertEquals(1, results.size)
        assertEquals("testuser", results[0]["username"])
    }

    @Test
    fun testRollbackTransaction() {
        // Test begin transaction
        vaultStore.beginTransaction()

        // Test execute update within transaction
        val insertQuery = "INSERT INTO credentials (service_name, username) VALUES (?, ?)"
        val insertParams = arrayOf<Any?>("Test Service", "testuser")
        vaultStore.executeUpdate(insertQuery, insertParams)

        // Test rollback transaction
        vaultStore.rollbackTransaction()

        // Verify the insert was rolled back
        val selectQuery = "SELECT * FROM credentials WHERE service_name = ?"
        val selectParams = arrayOf<Any?>("Test Service")
        val results = vaultStore.executeQuery(selectQuery, selectParams)
        assertTrue(results.isEmpty())
    }

    @Test
    fun testAutoLockTimeout() {
        // Set a short timeout for testing
        vaultStore.setAutoLockTimeout(1000) // 1 second

        // Verify vault is unlocked initially
        assertTrue(vaultStore.isVaultUnlocked())

        // Wait for timeout
        Thread.sleep(1100)

        // Verify vault is now locked
        assertFalse(vaultStore.isVaultUnlocked())
    }

    @Test
    fun testClearVault() {
        // Verify vault is unlocked initially
        assertTrue(vaultStore.isVaultUnlocked())

        // Clear the vault
        vaultStore.clearVault()

        // Verify vault is now locked
        assertFalse(vaultStore.isVaultUnlocked())

        // Verify we can't execute queries after clearing
        val query = "SELECT * FROM credentials"
        val results = vaultStore.executeQuery(query, emptyArray())
        assertTrue(results.isEmpty())
    }

    private fun loadTestDatabase(): String {
        // Load the test database file from resources
        val inputStream = javaClass.classLoader?.getResourceAsStream("test-encrypted-vault.txt")
            ?: throw IllegalStateException("Test database file not found")

        return inputStream.bufferedReader().use { it.readText() }
    }
}
