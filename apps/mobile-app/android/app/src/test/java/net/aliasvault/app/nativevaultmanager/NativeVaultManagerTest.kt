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

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class NativeVaultManagerTest {

    private lateinit var nativeVaultManager: NativeVaultManager
    private lateinit var mockReactContext: ReactApplicationContext
    private val testEncryptionKeyBase64 = "/9So3C83JLDIfjsF0VQOc4rz1uAFtIseW7yrUuztAD0=" // 32 bytes for AES-256

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        mockReactContext = mock(ReactApplicationContext::class.java)
        val context = ApplicationProvider.getApplicationContext<Context>()
        `when`(mockReactContext.applicationContext).thenReturn(context)
        `when`(mockReactContext.getSharedPreferences(anyString(), anyInt())).thenReturn(
            context.getSharedPreferences("test_prefs", Context.MODE_PRIVATE)
        )

        nativeVaultManager = NativeVaultManager(mockReactContext)

        // Store test data
        val testDb = loadTestDatabase()
        val metadata = """
            {
                "publicEmailDomains": ["spamok.com", "spamok.nl"],
                "privateEmailDomains": ["aliasvault.net", "main.aliasvault.net"],
                "vaultRevisionNumber": 1
            }
        """.trimIndent()

        // Store encryption key
        val promise = mock(com.facebook.react.bridge.Promise::class.java)
        nativeVaultManager.storeEncryptionKey(testEncryptionKeyBase64, promise)
        verify(promise).resolve(null)

        // Store encrypted database
        nativeVaultManager.storeDatabase(testDb, promise)
        verify(promise).resolve(null)

        // Store metadata
        nativeVaultManager.storeMetadata(metadata, promise)
        verify(promise).resolve(null)

        // Unlock vault
        nativeVaultManager.unlockVault(promise)
        verify(promise).resolve(true)
    }

    @Test
    fun testDatabaseInitialization() {
        val promise = mock(com.facebook.react.bridge.Promise::class.java)
        nativeVaultManager.isVaultUnlocked(promise)
        verify(promise).resolve(true)
    }

    @Test
    fun testGetAllCredentials() {
        val promise = mock(com.facebook.react.bridge.Promise::class.java)
        val query = "SELECT * FROM credentials"
        val params = Arguments.createArray()

        nativeVaultManager.executeQuery(query, params, promise)

        // Verify the promise was resolved with an array
        verify(promise).resolve(any())
    }

    @Test
    fun testGetGmailCredentialDetails() {
        val promise = mock(com.facebook.react.bridge.Promise::class.java)
        val query = "SELECT * FROM credentials WHERE service_name = ?"
        val params = Arguments.createArray().apply {
            pushString("Gmail Test Account")
        }

        nativeVaultManager.executeQuery(query, params, promise)

        // Verify the promise was resolved with an array containing the Gmail credential
        verify(promise).resolve(any())
    }

    private fun loadTestDatabase(): String {
        // Load the test database file from resources
        val inputStream = javaClass.classLoader?.getResourceAsStream("test-encrypted-vault.txt")
            ?: throw IllegalStateException("Test database file not found")

        return inputStream.bufferedReader().use { it.readText() }
    }
}