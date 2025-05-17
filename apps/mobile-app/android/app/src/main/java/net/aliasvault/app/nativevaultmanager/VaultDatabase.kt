package net.aliasvault.app.nativevaultmanager

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Base64
import android.util.Log
import net.aliasvault.app.credentialmanager.SharedCredentialStore
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream

class VaultDatabase(private val context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {
    private var currentTransaction: SQLiteDatabase? = null
    private val TAG = "VaultDatabase"

    override fun onCreate(db: SQLiteDatabase) {
        // Create tables as needed
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS vault_data (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Handle database upgrades if needed
        db.execSQL("DROP TABLE IF EXISTS vault_data")
        onCreate(db)
    }

    fun initializeWithEncryptedData(encryptedData: String) {
        try {
            // Get the encryption key from SharedCredentialStore
            val store = SharedCredentialStore.getInstance(context)

            // Decrypt the data using the encryption key
            val decryptedData = store.decryptData(encryptedData)

            // Decompress the data if it's compressed
            val decompressedData = decompressData(decryptedData)

            // Create an in-memory SQLite database
            currentTransaction = SQLiteDatabase.create(null)

            // Import the SQL statements from the decrypted data
            val statements = decompressedData.split(";")
            for (statement in statements) {
                if (statement.trim().isNotEmpty()) {
                    currentTransaction?.execSQL(statement)
                }
            }

            Log.d(TAG, "Database initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing database", e)
            throw e
        }
    }

    fun executeQuery(query: String, params: Array<Any?>): List<Map<String, Any?>> {
        val results = mutableListOf<Map<String, Any?>>()

        currentTransaction?.let { db ->
            val cursor = db.rawQuery(query, params.map { it?.toString() }.toTypedArray())

            cursor.use {
                val columnNames = it.columnNames
                while (it.moveToNext()) {
                    val row = mutableMapOf<String, Any?>()
                    for (columnName in columnNames) {
                        when (it.getType(it.getColumnIndexOrThrow(columnName))) {
                            android.database.Cursor.FIELD_TYPE_NULL -> row[columnName] = null
                            android.database.Cursor.FIELD_TYPE_INTEGER -> row[columnName] = it.getLong(it.getColumnIndexOrThrow(columnName))
                            android.database.Cursor.FIELD_TYPE_FLOAT -> row[columnName] = it.getDouble(it.getColumnIndexOrThrow(columnName))
                            android.database.Cursor.FIELD_TYPE_STRING -> row[columnName] = it.getString(it.getColumnIndexOrThrow(columnName))
                            android.database.Cursor.FIELD_TYPE_BLOB -> row[columnName] = it.getBlob(it.getColumnIndexOrThrow(columnName))
                        }
                    }
                    results.add(row)
                }
            }
        }

        return results
    }

    fun executeUpdate(query: String, params: Array<Any?>): Int {
        currentTransaction?.let { db ->
            db.execSQL(query, params.map { it?.toString() }.toTypedArray())
            // Get the number of affected rows
            val cursor = db.rawQuery("SELECT changes()", null)
            cursor.use {
                if (it.moveToFirst()) {
                    return it.getInt(0)
                }
            }
        }
        return 0
    }

    fun beginTransaction() {
        currentTransaction?.beginTransaction()
    }

    fun commitTransaction() {
        currentTransaction?.setTransactionSuccessful()
        currentTransaction?.endTransaction()
        currentTransaction = null
    }

    fun rollbackTransaction() {
        currentTransaction?.endTransaction()
        currentTransaction = null
    }

    private fun decompressData(compressedData: String): String {
        val decoded = Base64.decode(compressedData, Base64.DEFAULT)
        val inputStream = GZIPInputStream(ByteArrayInputStream(decoded))
        val outputStream = ByteArrayOutputStream()

        val buffer = ByteArray(1024)
        var len: Int
        while (inputStream.read(buffer).also { len = it } > 0) {
            outputStream.write(buffer, 0, len)
        }

        return outputStream.toString("UTF-8")
    }

    private fun compressData(data: String): String {
        val outputStream = ByteArrayOutputStream()
        val gzipOutputStream = GZIPOutputStream(outputStream)
        gzipOutputStream.write(data.toByteArray(Charsets.UTF_8))
        gzipOutputStream.close()
        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT)
    }

    companion object {
        private const val DATABASE_NAME = "vault.db"
        private const val DATABASE_VERSION = 1
    }
}